const AppError = require("../utils/AppError");

const validate = (schemas) => (req, res, next) => {
  for (const location of ["params", "query", "body"]) {
    if (!schemas[location]) continue;
    const result = schemas[location].safeParse(req[location]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: [location, ...issue.path].join("."),
        message: issue.message,
      }));
      return next(new AppError(400, "VALIDATION_ERROR", "Request validation failed", details));
    }
    req[location] = result.data;
  }
  next();
};

module.exports = { validate };
