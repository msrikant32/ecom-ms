const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../../middleware/auth');
const { issueTicket } = require('../../websocket/ticketService');

const router = Router();

// Tight limiter: tickets are cheap to mint but each one is a connection
// attempt - capping this blunts scripted connection-flooding via the
// ticket endpoint itself.
const ticketLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many ticket requests, slow down.' } },
});

router.post('/ticket', authenticate, ticketLimiter, async (req, res, next) => {
  try {
    const { ticket, expiresIn } = await issueTicket(req.user);
    res.status(201).json({ ticket, expiresIn });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
