const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const parseInteger = (value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
};

const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  "http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInteger(process.env.PORT, 3000, { max: 65535 }),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "3d",
  allowedOrigins,
  jsonLimit: process.env.JSON_BODY_LIMIT || "100kb",
  apiRateLimitWindowMs: parseInteger(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMax: parseInteger(process.env.API_RATE_LIMIT_MAX, 300),
  authRateLimitMax: parseInteger(process.env.AUTH_RATE_LIMIT_MAX, 20),
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY,
  resourceBucket: process.env.SUPABASE_RESOURCE_BUCKET || "CBResources",
  lostFoundBucket: process.env.SUPABASE_LOST_FOUND_BUCKET || "CBLostFound",
  signedUrlTtlSeconds: parseInteger(process.env.SIGNED_URL_TTL_SECONDS, 300, { min: 60, max: 3600 }),
  maxResourceFileBytes: parseInteger(process.env.MAX_RESOURCE_FILE_BYTES, 10 * 1024 * 1024),
  maxImageFileBytes: parseInteger(process.env.MAX_IMAGE_FILE_BYTES, 5 * 1024 * 1024),
  autoApproveResources: parseBoolean(process.env.AUTO_APPROVE_RESOURCES, false),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  serveWebClient: parseBoolean(process.env.SERVE_WEB_CLIENT, process.env.NODE_ENV === "production"),
});

function assertServerEnvironment() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGO_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (env.nodeEnv === "production" && (!env.supabaseUrl || !env.supabaseServiceKey)) {
    missing.push("SUPABASE_URL", "SUPABASE_SERVICE_KEY");
  }
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${[...new Set(missing)].join(", ")}`);
  }
  if (env.nodeEnv === "production" && env.jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }
}

module.exports = { env, assertServerEnvironment };
