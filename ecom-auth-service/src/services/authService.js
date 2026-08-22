const User = require('../models/User');
const AppError = require('../utils/AppError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

async function register({ email, password }) {
  const existing = await User.findOne({ email });
  if (existing) throw AppError.conflict('An account with this email already exists');

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ email, passwordHash });

  return issueTokens(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email });
  // Same error/timing profile for "no such user" and "wrong password" so
  // responses can't be used to enumerate accounts.
  const passwordOk = user ? await user.verifyPassword(password) : await User.hashPassword('dummy');
  if (!user || !passwordOk) {
    throw AppError.unauthorized('Invalid email or password');
  }
  return issueTokens(user);
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw AppError.unauthorized('User no longer exists');
  if (user.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized('Refresh token has been revoked');
  }

  return issueTokens(user);
}

async function revokeAllSessions(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  user.tokenVersion += 1;
  await user.save();
}

async function getById(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return user.toPublicJSON();
}

function issueTokens(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
    user: user.toPublicJSON(),
  };
}

module.exports = { register, login, refresh, revokeAllSessions, getById };
