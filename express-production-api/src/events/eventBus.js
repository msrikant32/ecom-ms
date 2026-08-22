const { EventEmitter } = require('events');
const logger = require('../config/logger');

/**
 * In-process domain event bus.
 *
 * This demonstrates the *pattern* of event-driven, decoupled async
 * processing (publisher doesn't know or care who's listening, handlers run
 * off the request/response cycle). In a real microservices setup you'd
 * swap this for a message broker - e.g. publish to SQS/RabbitMQ/Kafka here
 * instead of emitter.emit(), and run listeners as separate consumer
 * services/workers. The publish-side API (emit) and the decoupling
 * contract stay the same either way, which is why services should always
 * depend on this interface rather than a specific transport.
 */
class EventBus extends EventEmitter {
  publish(eventName, payload) {
    logger.info('event.published', { eventName, payload });
    // setImmediate ensures listeners run asynchronously, off the
    // request/response cycle, so a slow listener never blocks the API reply.
    setImmediate(() => this.emit(eventName, payload));
  }
}

module.exports = new EventBus();
