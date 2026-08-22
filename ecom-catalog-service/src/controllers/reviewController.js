const reviewService = require('../services/reviewService');

async function upsert(req, res, next) {
  try {
    const review = await reviewService.upsertReview(req.params.id, req.user, req.body);
    res.status(201).json({ review });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const result = await reviewService.list(req.params.id, req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await reviewService.remove(req.params.id, req.params.reviewId, req.user);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { upsert, list, remove };
