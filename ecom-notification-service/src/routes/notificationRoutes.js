const { Router } = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', notificationController.list);
router.get('/order/:orderId', notificationController.getByOrderId);

module.exports = router;
