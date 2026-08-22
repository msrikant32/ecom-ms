const config = require('../config');
const AppError = require('../utils/AppError');
const uploadService = require('../services/uploadService');

const MAX_FILENAME_LENGTH = 255;

async function init(req, res, next) {
  try {
    const { fileName, fileSize, chunkSize } = req.body;
    const session = await uploadService.initUpload({
      userId: req.user.id,
      fileName,
      fileSize,
      chunkSize,
    });
    res.status(201).json({ data: session });
  } catch (err) {
    next(err);
  }
}

async function status(req, res, next) {
  try {
    const session = await uploadService.getStatus(req.params.uploadId);
    res.status(200).json({ data: session });
  } catch (err) {
    next(err);
  }
}

async function uploadChunk(req, res, next) {
  try {
    const result = await uploadService.writeChunk(
      req.params.uploadId,
      Number(req.params.index),
      req
    );
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function complete(req, res, next) {
  try {
    const result = await uploadService.completeUpload(req.params.uploadId);
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

// The naive counterpart to init/uploadChunk/complete: one request, the
// whole file, buffered fully in memory here (not streamed), then handed
// to uploadService.uploadSync for the actual blocking fs.writeFileSync.
async function syncUpload(req, res, next) {
  try {
    const rawFileName = req.headers['x-upload-filename'];
    const fileName = rawFileName
      ? String(rawFileName).slice(0, MAX_FILENAME_LENGTH)
      : 'upload.bin';

    const chunks = [];
    let received = 0;

    await new Promise((resolve, reject) => {
      req.on('data', (buf) => {
        received += buf.length;
        if (received > config.upload.maxSyncFileSizeBytes) {
          req.destroy();
          reject(
            AppError.badRequest(
              `Sync upload demo is capped at ${config.upload.maxSyncFileSizeBytes} bytes`
            )
          );
          return;
        }
        chunks.push(buf);
      });
      req.on('end', resolve);
      req.on('error', reject);
    });

    const fileBuffer = Buffer.concat(chunks);
    const result = await uploadService.uploadSync({ fileName, fileBuffer });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
}

async function abort(req, res, next) {
  try {
    await uploadService.abortUpload(req.params.uploadId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { init, status, uploadChunk, complete, syncUpload, abort };
