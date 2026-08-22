const { Router } = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = Router();

router.get('/', categoryController.list);
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [body('name').isString().trim().isLength({ min: 1, max: 100 })],
  validate,
  categoryController.create
);

module.exports = router;
