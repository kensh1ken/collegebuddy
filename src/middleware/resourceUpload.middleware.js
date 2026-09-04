const multer = require('multer');
const { env } = require('../config/env');

const allowedTypes = new Set([
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxResourceFileBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error('Only PDF, PPT, PPTX, DOC, and DOCX files are allowed');
      error.statusCode = 400;
      error.code = 'INVALID_FILE_TYPE';
      return callback(error);
    }
    callback(null, true);
  },
});
