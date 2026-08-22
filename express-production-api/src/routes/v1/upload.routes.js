const { Router } = require('express');
const { body, param } = require('express-validator');
const uploadController = require('../../controllers/uploadController');
const uploadService = require('../../services/uploadService');
const validate = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { authorizeOwnerOrRoles } = require('../../middleware/authorize');
const { uploadChunkLimiter } = require('../../middleware/rateLimit');

const router = Router();

// All upload routes require authentication.
router.use(authenticate);

// Resource-ownership check reused across every route below that operates
// on an existing upload session - only the uploader (or an admin) may
// touch it.
const ownsUpload = authorizeOwnerOrRoles(async (req) => {
  const session = await uploadService.getSession(req.params.uploadId);
  return session && session.userId;
}, 'admin');

router.post(
  '/',
  [
    body('fileName').isString().trim().isLength({ min: 1, max: 255 }),
    body('fileSize').isInt({ min: 1 }),
    body('chunkSize').isInt({ min: 1 }),
  ],
  validate,
  uploadController.init
);

// The naive counterpart to the chunked/async flow above: one request, the
// whole file, no session/ownership tracking needed since nothing is kept.
router.post('/sync', uploadController.syncUpload);

router.get(
  '/:uploadId',
  [param('uploadId').isUUID()],
  validate,
  ownsUpload,
  uploadController.status
);

// The chunk body is raw binary (Content-Type: application/octet-stream),
// not JSON - express.json() upstream skips non-JSON content types and
// leaves the request stream untouched, so the controller can pipe it
// straight to disk.
router.put(
  '/:uploadId/chunks/:index',
  uploadChunkLimiter,
  [param('uploadId').isUUID(), param('index').isInt({ min: 0 })],
  validate,
  ownsUpload,
  uploadController.uploadChunk
);

router.post(
  '/:uploadId/complete',
  [param('uploadId').isUUID()],
  validate,
  ownsUpload,
  uploadController.complete
);

router.delete(
  '/:uploadId',
  [param('uploadId').isUUID()],
  validate,
  ownsUpload,
  uploadController.abort
);

module.exports = router;
