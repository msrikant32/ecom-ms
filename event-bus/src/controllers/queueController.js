const queueService = require('../services/queueService');
const AppError = require('../utils/AppError');

function sendToQueue(req, res, next) {
  try {
    const { queueName } = req.params;
    const { payload, maxAttempts } = req.body;
    if (payload === undefined) {
      return next(AppError.badRequest('payload is required'));
    }
    const messageId = queueService.sendToQueue(queueName, payload, maxAttempts);
    res.status(202).json({ accepted: true, queue: queueName, messageId });
  } catch (err) {
    next(err);
  }
}

function publish(req, res, next) {
  try {
    const { eventName } = req.params;
    const enqueued = queueService.publish(eventName, req.body);
    res.status(202).json({ accepted: true, event: eventName, enqueued });
  } catch (err) {
    next(err);
  }
}

function receive(req, res, next) {
  try {
    const { queueName } = req.params;
    const maxMessages = req.query.maxMessages ? parseInt(req.query.maxMessages, 10) : undefined;
    const visibilityTimeoutSeconds = req.query.visibilityTimeoutSeconds
      ? parseInt(req.query.visibilityTimeoutSeconds, 10)
      : undefined;
    const messages = queueService.receive(queueName, { maxMessages, visibilityTimeoutSeconds });
    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
}

function ack(req, res, next) {
  try {
    const { queueName, receiptHandle } = req.params;
    const deleted = queueService.ack(queueName, receiptHandle);
    if (!deleted) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Message not found or already acked' } });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

function deadLetters(req, res, next) {
  try {
    const { queueName } = req.params;
    res.status(200).json({ messages: queueService.listDeadLetters(queueName) });
  } catch (err) {
    next(err);
  }
}

function stats(req, res, next) {
  try {
    res.status(200).json({ stats: queueService.stats() });
  } catch (err) {
    next(err);
  }
}

module.exports = { publish, sendToQueue, receive, ack, deadLetters, stats };
