const jwt = require("jsonwebtoken");
const User = require("../models/auth.model");
const { env } = require("../config/env");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/response");
const { privateUser } = require("../utils/serializers");

const createToken = (id) => jwt.sign({ id: String(id) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000,
  path: "/",
});

module.exports.signup_post = async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.exists({ email });
  if (existing) throw new AppError(409, "ACCOUNT_EXISTS", "An account with this email already exists");

  const user = await User.create({ name, email, password });
  const token = createToken(user._id);
  res.cookie("jwt", token, cookieOptions());
  return sendSuccess(res, {
    status: 201,
    message: "Account created successfully",
    data: { user: privateUser(user), token, profileCompleted: user.profileCompleted },
  });
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.login(email, password);
  if (!user) throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  if (user.isBlocked) throw new AppError(403, "ACCOUNT_BLOCKED", "This account has been blocked");

  const token = createToken(user._id);
  res.cookie("jwt", token, cookieOptions());
  return sendSuccess(res, {
    message: "Login successful",
    data: { user: privateUser(user), token, profileCompleted: user.profileCompleted },
  });
};

module.exports.logout_post = async (_req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions();
  res.clearCookie("jwt", clearOptions);
  return sendSuccess(res, { message: "Logged out successfully" });
};
