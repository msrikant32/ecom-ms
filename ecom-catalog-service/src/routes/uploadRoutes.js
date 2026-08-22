const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { upload } = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

const router = Router();

router.post('/', authenticate, authorize('admin'), upload.single('image'), uploadController.uploadImage);

module.exports = router;
