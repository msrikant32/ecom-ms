const { Router } = require('express');
const queueController = require('../controllers/queueController');

const router = Router();

// Producer - order-service publishes here, unchanged path from the old push
// model. Internally this now writes durable rows instead of firing webhooks.
router.post('/events/:eventName', queueController.publish);

// Direct send to one queue (SQS SendMessage equivalent) - bypasses the
// event-name fan-out config. Ops/debugging/demo use.
router.post('/queues/:queueName/messages', queueController.sendToQueue);

// Consumer (pull-based, SQS-style): poll for messages, then explicitly ack.
router.post('/queues/:queueName/receive', queueController.receive);
router.delete('/queues/:queueName/messages/:receiptHandle', queueController.ack);

// Ops visibility.
router.get('/queues/:queueName/dlq', queueController.deadLetters);
router.get('/stats', queueController.stats);

module.exports = router;
