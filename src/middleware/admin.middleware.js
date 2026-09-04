const AppError = require('../utils/AppError');

module.exports.adminOnly = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'ADMIN_REQUIRED', 'Administrator access is required'));
  }
  next();
};
