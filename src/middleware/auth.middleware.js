const jwt = require("jsonwebtoken");
const User = require("../models/auth.model");
const { env } = require("../config/env");
const AppError = require("../utils/AppError");

const requireAuth = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7).trim()
        : null;

    const token = req.cookies.jwt || bearer;

    if (!token) {
      throw new AppError(401, "AUTHENTICATION_REQUIRED", "Authentication is required");
    }
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch (_error) {
      throw new AppError(401, "INVALID_TOKEN", "The authentication token is invalid or expired");
    }
    const user = await User.findById(decoded.id);
    if (!user) throw new AppError(401, "INVALID_SESSION", "The account for this session no longer exists");
    if (user.isBlocked) throw new AppError(403, "ACCOUNT_BLOCKED", "This account has been blocked");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
