const jwt = require('jsonwebtoken');
const config = require('../config');

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

module.exports = { verifyAccessToken };
