const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../../controllers/authController');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimit');
const { csrfProtection } = require('../../middleware/csrf');

const router = Router();

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    // OWASP ASVS-aligned minimums: length + complexity, but no arbitrary
    // "must contain a special character" rules that push users to weaker,
    // predictable patterns.
    body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

// These two are authenticated solely by the httpOnly refresh cookie, which
// browsers attach automatically on cross-site requests - exactly what CSRF
// exploits. csrfProtection requires a matching X-CSRF-Token header (fetched
// from GET /api/v1/csrf-token) that a cross-site attacker cannot obtain.
router.post('/refresh', authLimiter, csrfProtection, authController.refresh);
router.post('/logout', csrfProtection, authController.logout);

// logout-all is authenticated via the Authorization header (Bearer token),
// not the cookie, so it isn't CSRF-exposed the same way - a cross-site page
// cannot attach a custom Authorization header to a forged request.
router.post('/logout-all', authenticate, authController.logoutAllSessions);

module.exports = router;
