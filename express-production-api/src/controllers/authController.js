const authService = require('../services/authService');
const config = require('../config');

const REFRESH_COOKIE_OPTS = {
  httpOnly: true, // inaccessible to JS -> mitigates XSS token theft
  secure: config.env === 'production', // HTTPS-only in prod
  sameSite: 'strict', // mitigates CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth', // scope the cookie to auth endpoints only
};

async function register(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.register(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'No refresh token provided' } });
    }
    const { accessToken, refreshToken, user } = await authService.refresh(token);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    res.clearCookie('refreshToken', { path: REFRESH_COOKIE_OPTS.path });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function logoutAllSessions(req, res, next) {
  try {
    await authService.revokeAllSessions(req.user.id);
    res.clearCookie('refreshToken', { path: REFRESH_COOKIE_OPTS.path });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, logoutAllSessions };
