const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Factory rather than a bare module singleton so tests can spin up an
// isolated in-memory store (':memory:') instead of touching the real
// file-backed queue that the running services depend on.
function createQueueStore(dbPath) {
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      queue TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'visible', -- visible | in_flight | dead
      receipt_handle TEXT,
      visible_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_queue_status_visible ON messages(queue, status, visible_at);
  `);

  function enqueue(queueName, payload, maxAttempts) {
    const id = crypto.randomUUID();
    const now = Date.now();
    db.prepare(
      `INSERT INTO messages (id, queue, payload, status, visible_at, attempts, max_attempts, created_at)
       VALUES (?, ?, ?, 'visible', ?, 0, ?, ?)`
    ).run(id, queueName, JSON.stringify(payload), now, maxAttempts, now);
    return id;
  }

  // Messages left in_flight past their visibility timeout without being
  // acked become visible again - this IS the redelivery mechanism (mirrors
  // SQS: a consumer that crashes mid-processing doesn't lose the message,
  // it just comes back for another consumer/attempt).
  function reclaimExpired(queueName) {
    const now = Date.now();
    db.prepare(`UPDATE messages SET status = 'visible' WHERE queue = ? AND status = 'in_flight' AND visible_at <= ?`).run(
      queueName,
      now
    );
  }

  function receive(queueName, maxMessages, visibilityTimeoutMs) {
    reclaimExpired(queueName);
    const now = Date.now();

    const rows = db
      .prepare(`SELECT * FROM messages WHERE queue = ? AND status = 'visible' AND visible_at <= ? ORDER BY created_at ASC LIMIT ?`)
      .all(queueName, now, maxMessages);

    const delivered = [];
    for (const row of rows) {
      const nextAttempts = row.attempts + 1;
      // Already delivered max_attempts times without an ack - dead-letter it
      // instead of handing it out again.
      if (nextAttempts > row.max_attempts) {
        db.prepare(`UPDATE messages SET status = 'dead', attempts = ? WHERE id = ?`).run(nextAttempts, row.id);
        continue;
      }
      const receiptHandle = crypto.randomUUID();
      db.prepare(`UPDATE messages SET status = 'in_flight', receipt_handle = ?, visible_at = ?, attempts = ? WHERE id = ?`).run(
        receiptHandle,
        now + visibilityTimeoutMs,
        nextAttempts,
        row.id
      );
      delivered.push({
        messageId: row.id,
        receiptHandle,
        payload: JSON.parse(row.payload),
        attempts: nextAttempts,
      });
    }
    return delivered;
  }

  function ack(queueName, receiptHandle) {
    const result = db
      .prepare(`DELETE FROM messages WHERE queue = ? AND receipt_handle = ? AND status = 'in_flight'`)
      .run(queueName, receiptHandle);
    return result.changes > 0;
  }

  function listDeadLetters(queueName) {
    return db
      .prepare(`SELECT id, payload, attempts, created_at FROM messages WHERE queue = ? AND status = 'dead' ORDER BY created_at DESC`)
      .all(queueName)
      .map((row) => ({ ...row, payload: JSON.parse(row.payload) }));
  }

  function stats() {
    return db.prepare(`SELECT queue, status, COUNT(*) as count FROM messages GROUP BY queue, status`).all();
  }

  return { enqueue, receive, ack, listDeadLetters, stats, close: () => db.close() };
}

const DATA_DIR = path.join(__dirname, '../../data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const defaultStore = createQueueStore(path.join(DATA_DIR, 'queue.db'));

module.exports = { createQueueStore, ...defaultStore };
