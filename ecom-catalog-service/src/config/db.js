const mongoose = require('mongoose');
const config = require('./index');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connectDB() {
  mongoose.connection.on('error', (err) => {
    logger.error('mongodb.connection_error', { err: err.message });
  });
  mongoose.connection.on('disconnected', () => {
    logger.warn('mongodb.disconnected');
  });

  await mongoose.connect(config.mongodb.uri);
  logger.info('mongodb.connected', { uri: redactUri(config.mongodb.uri) });
}

async function disconnectDB() {
  await mongoose.disconnect();
}

function redactUri(uri) {
  return uri.replace(/\/\/[^@/]+@/, '//***:***@');
}

module.exports = { connectDB, disconnectDB };
