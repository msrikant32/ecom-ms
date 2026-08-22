const { Router } = require('express');
const { pingLimiter } = require('../../middleware/rateLimit');

const router = Router();

// Deliberately public and trivial: this exists purely so the sync-vs-async
// upload demo can poll it continuously and visualize event-loop
// responsiveness (or the lack of it) while an upload is in flight.
router.get('/', pingLimiter, (req, res) => {
  res.status(200).json({ timestamp: Date.now() });
});

module.exports = router;
