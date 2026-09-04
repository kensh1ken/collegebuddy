const multer = require('multer');
const { env } = require('../config/env');

const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxImageFileBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) {
      const error = new Error('Only JPEG, PNG, and WebP images are allowed');
      error.statusCode = 400;
      error.code = 'INVALID_IMAGE_TYPE';
      return callback(error);
    }
    callback(null, true);
  },
});
