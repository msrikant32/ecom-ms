const jwt = require('jsonwebtoken');
const config = require('../config');

// Verify-only - this service never issues tokens, only auth-service does.
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

module.exports = { verifyAccessToken };
