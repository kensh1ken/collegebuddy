const { Router } = require('express');
const routes = Router();
const authController = require('../controllers/auth.controller');
const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');
const { validate } = require('../middleware/validate.middleware');
const validation = require('../validators/auth.validation');
const asyncHandler = require('../utils/asyncHandler');

const authLimiter = rateLimit({
  windowMs: env.apiRateLimitWindowMs,
  limit: env.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many authentication attempts' } },
});

routes.post('/login', authLimiter, validate({ body: validation.login }), asyncHandler(authController.login_post));
routes.post('/signup', authLimiter, validate({ body: validation.signup }), asyncHandler(authController.signup_post));
routes.post('/logout', asyncHandler(authController.logout_post));

module.exports = routes;


