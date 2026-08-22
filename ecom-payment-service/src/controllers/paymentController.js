const paymentService = require('../services/paymentService');

async function charge(req, res, next) {
  try {
    const payment = await paymentService.charge({
      orderId: req.body.orderId,
      userId: req.user.id,
      amountCents: req.body.amountCents,
    });
    const statusCode = payment.status === 'succeeded' ? 200 : 402;
    res.status(statusCode).json({ payment });
  } catch (err) {
    next(err);
  }
}

async function getByOrderId(req, res, next) {
  try {
    const payment = await paymentService.getByOrderId(req.params.orderId, req.user);
    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}

async function refund(req, res, next) {
  try {
    const payment = await paymentService.refund(req.params.orderId, req.user);
    res.status(200).json({ payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { charge, getByOrderId, refund };
