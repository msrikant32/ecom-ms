const { Router } = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.get('/:productId', authenticate, authorize('admin'), inventoryController.getByProductId);

module.exports = router;
