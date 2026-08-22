const notificationService = require('../services/notificationService');

async function list(req, res, next) {
  try {
    const result = await notificationService.list(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getByOrderId(req, res, next) {
  try {
    const notifications = await notificationService.getByOrderId(req.params.orderId);
    res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getByOrderId };
