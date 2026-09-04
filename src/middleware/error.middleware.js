const multer = require("multer");
const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Route not found"));
}

function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let code = err.code || "INTERNAL_ERROR";
  let message = err.message || "An unexpected error occurred";
  let details = err.details;

  if (err instanceof multer.MulterError) {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    code = err.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "UPLOAD_ERROR";
  } else if (err.name === "CastError") {
    status = 400;
    code = "INVALID_ID";
    message = "The supplied identifier is invalid";
  } else if (err.name === "ValidationError") {
    status = 400;
    code = "DATABASE_VALIDATION_ERROR";
    message = "The submitted data is invalid";
    details = Object.values(err.errors || {}).map((item) => ({ path: item.path, message: item.message }));
  } else if (err.code === 11000) {
    status = 409;
    code = "DUPLICATE_VALUE";
    message = "A record with that value already exists";
  }

  if (status >= 500 && process.env.NODE_ENV !== "test") {
    console.error(`[${req.id || "no-request-id"}]`, err);
  }

  const safeMessage = status >= 500 && process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : message;

  const body = { success: false, error: { code, message: safeMessage }, message: safeMessage };
  if (details && status < 500) body.error.details = details;
  res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
