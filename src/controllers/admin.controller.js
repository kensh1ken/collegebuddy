const User = require('../models/auth.model');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { privateUser } = require('../utils/serializers');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports.getAllUsers = async (req, res) => {
  const { page, limit, search, ...query } = req.query;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ name: pattern }, { email: pattern }, { rollNumber: pattern }];
  }
  const [documents, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(query),
  ]);
  const users = documents.map(privateUser);
  return sendSuccess(res, { data: { items: users, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
};

module.exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return sendSuccess(res, { data: { user: privateUser(user) } });
};

async function setBlocked(req, res, isBlocked) {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  if (String(user._id) === String(req.user._id)) throw new AppError(400, 'SELF_MODERATION_FORBIDDEN', 'You cannot change your own blocked status');
  if (user.role === 'admin') throw new AppError(403, 'ADMIN_MODERATION_FORBIDDEN', 'Administrator accounts cannot be blocked through this endpoint');
  user.isBlocked = isBlocked;
  await user.save();
  return sendSuccess(res, { message: `User ${isBlocked ? 'blocked' : 'unblocked'}`, data: { user: privateUser(user) } });
}

module.exports.blockUser = (req, res) => setBlocked(req, res, true);
module.exports.unBlockUser = (req, res) => setBlocked(req, res, false);
