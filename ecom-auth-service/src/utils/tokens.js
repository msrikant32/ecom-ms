const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, roles: user.roles },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessTtl }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, tokenVersion: user.tokenVersion || 0 },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshTtl }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret);
}

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
