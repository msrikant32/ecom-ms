const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../config/logger');
const { getCache } = require('../utils/cache');
const AppError = require('../utils/AppError');

const TMP_DIR = path.join(config.upload.dir, 'tmp');
const COMPLETE_DIR = path.join(config.upload.dir, 'complete');

function sessionKey(uploadId) {
  return `upload:${uploadId}`;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function getSession(uploadId) {
  const cache = await getCache();
  return cache.get(sessionKey(uploadId));
}

async function saveSession(uploadId, session) {
  const cache = await getCache();
  await cache.set(sessionKey(uploadId), session, config.upload.sessionTtlSeconds);
}

function chunkPath(uploadId, index) {
  return path.join(TMP_DIR, uploadId, `chunk-${String(index).padStart(6, '0')}`);
}

async function initUpload({ userId, fileName, fileSize, chunkSize }) {
  if (fileSize > config.upload.maxFileSizeBytes) {
    throw AppError.badRequest(
      `File exceeds the maximum allowed size of ${config.upload.maxFileSizeBytes} bytes`
    );
  }
  if (chunkSize > config.upload.maxChunkSizeBytes) {
    throw AppError.badRequest(
      `Chunk size exceeds the maximum allowed size of ${config.upload.maxChunkSizeBytes} bytes`
    );
  }

  const uploadId = uuidv4();
  const totalChunks = Math.ceil(fileSize / chunkSize);
  await ensureDir(path.join(TMP_DIR, uploadId));

  const session = {
    uploadId,
    userId,
    fileName,
    fileSize,
    chunkSize,
    totalChunks,
    receivedChunks: [],
    status: 'in-progress',
    createdAt: new Date().toISOString(),
  };
  await saveSession(uploadId, session);

  logger.info('upload.initiated', { uploadId, fileName, fileSize, totalChunks });
  return { uploadId, totalChunks, chunkSize };
}

/**
 * Streams a single chunk straight to disk. `req` is still a live, unread
 * request stream at this point - the global express.json() middleware only
 * buffers bodies whose Content-Type matches application/json, so an
 * application/octet-stream chunk PUT reaches here untouched. Piping it
 * directly to a file means the chunk's bytes pass through in ~64KB
 * internal buffer windows, never fully materialized in process memory
 * regardless of how large the chunk is - the actual "optimization" this
 * whole endpoint exists to demonstrate.
 */
async function writeChunk(uploadId, index, req) {
  const session = await getSession(uploadId);
  if (!session) throw AppError.notFound('Upload session not found or expired');
  if (session.status === 'complete') {
    throw AppError.conflict('Upload already completed');
  }
  if (!Number.isInteger(index) || index < 0 || index >= session.totalChunks) {
    throw AppError.badRequest(`Chunk index must be between 0 and ${session.totalChunks - 1}`);
  }

  const destPath = chunkPath(uploadId, index);

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(destPath);
    let received = 0;
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      writeStream.destroy();
      reject(err);
    };

    // Defends against a client that declared a small chunkSize at init
    // time but streams more bytes than that into a single chunk request -
    // otherwise a single "chunk" could silently fill the disk.
    req.on('data', (buf) => {
      received += buf.length;
      if (received > session.chunkSize) {
        req.destroy();
        fail(AppError.badRequest('Chunk body exceeds the declared chunkSize'));
      }
    });

    req.on('error', fail);
    writeStream.on('error', fail);
    writeStream.on('finish', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });

    req.pipe(writeStream);
  });

  if (!session.receivedChunks.includes(index)) {
    session.receivedChunks.push(index);
    session.receivedChunks.sort((a, b) => a - b);
    await saveSession(uploadId, session);
  }

  return {
    uploadId,
    receivedChunks: session.receivedChunks,
    totalChunks: session.totalChunks,
    complete: session.receivedChunks.length === session.totalChunks,
  };
}

async function getStatus(uploadId) {
  const session = await getSession(uploadId);
  if (!session) throw AppError.notFound('Upload session not found or expired');
  return {
    uploadId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    totalChunks: session.totalChunks,
    receivedChunks: session.receivedChunks,
    status: session.status,
  };
}

/**
 * Stream-concatenates every chunk, in order, into the final file. Chunks
 * are piped in one at a time (never `.end()`-ing the output until the
 * last one) so at most one chunk's worth of streamed data is ever in
 * flight, no matter the total file size.
 */
async function completeUpload(uploadId) {
  const session = await getSession(uploadId);
  if (!session) throw AppError.notFound('Upload session not found or expired');
  if (session.status === 'complete') {
    return { uploadId, fileName: session.fileName, size: session.fileSize };
  }

  const missing = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!session.receivedChunks.includes(i)) missing.push(i);
  }
  if (missing.length > 0) {
    throw AppError.conflict('Not all chunks have been received yet', { missingChunks: missing });
  }

  await ensureDir(COMPLETE_DIR);
  const finalPath = path.join(COMPLETE_DIR, uploadId);

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(finalPath);
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      output.destroy();
      reject(err);
    };
    output.on('error', fail);
    output.on('finish', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });

    (async () => {
      try {
        for (let i = 0; i < session.totalChunks; i++) {
          await new Promise((res, rej) => {
            const input = fs.createReadStream(chunkPath(uploadId, i));
            input.on('error', rej);
            input.on('end', res);
            input.pipe(output, { end: false });
          });
        }
        output.end();
      } catch (err) {
        fail(err);
      }
    })();
  });

  await fsp.rm(path.join(TMP_DIR, uploadId), { recursive: true, force: true });

  // This demo never retains uploaded content: the whole point was proving
  // the chunk-streaming/assembly mechanism works, not standing up a file
  // store. Deleting immediately means nothing accumulates on disk across
  // demo runs.
  await fsp.rm(finalPath, { force: true });

  session.status = 'complete';
  await saveSession(uploadId, session);

  logger.info('upload.completed_and_deleted', {
    uploadId,
    fileName: session.fileName,
    size: session.fileSize,
  });
  return { uploadId, fileName: session.fileName, size: session.fileSize };
}

/**
 * The deliberate anti-pattern this demo exists to contrast against
 * writeChunk/completeUpload above: the ENTIRE file is buffered in memory
 * first (no streaming), then written with a SYNCHRONOUS fs call. While
 * fs.writeFileSync runs, Node's single JS thread can do nothing else - no
 * other request, no timer, no WebSocket frame, nothing - until it
 * returns. Compare against writeChunk, where req.pipe() lets the event
 * loop stay free the whole time.
 */
async function uploadSync({ fileName, fileBuffer }) {
  if (fileBuffer.length > config.upload.maxSyncFileSizeBytes) {
    throw AppError.badRequest(
      `Sync upload demo is capped at ${config.upload.maxSyncFileSizeBytes} bytes on purpose - large enough to make the blocking pause visible, small enough that it can't actually wedge the server for long.`
    );
  }

  await ensureDir(COMPLETE_DIR);
  const tempPath = path.join(COMPLETE_DIR, `sync-${uuidv4()}`);

  const startedAt = Date.now();
  fs.writeFileSync(tempPath, fileBuffer); // <- the blocking call itself
  const blockedForMs = Date.now() - startedAt;

  fs.unlinkSync(tempPath); // same "don't retain content" policy as the async path

  logger.info('upload.sync_completed', { fileName, size: fileBuffer.length, blockedForMs });
  return { fileName, size: fileBuffer.length, blockedForMs };
}

async function abortUpload(uploadId) {
  const session = await getSession(uploadId);
  if (!session) return;

  const cache = await getCache();
  await cache.del(sessionKey(uploadId));
  await fsp.rm(path.join(TMP_DIR, uploadId), { recursive: true, force: true });
}

module.exports = {
  initUpload,
  writeChunk,
  getStatus,
  getSession,
  completeUpload,
  uploadSync,
  abortUpload,
};
