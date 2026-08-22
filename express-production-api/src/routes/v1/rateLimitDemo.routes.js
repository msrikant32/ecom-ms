const { Router } = require('express');
const { demoLimiter } = require('../../middleware/rateLimit');

const router = Router();

// Deliberately public and trivial - exists purely so the rate-limiting demo
// page can hit a real, tightly-tuned limiter and show real 429s/RateLimit-*
// headers instead of a staged animation.
router.get('/', demoLimiter, (req, res) => {
  res.status(200).json({ ok: true, timestamp: Date.now() });
});

module.exports = router;
