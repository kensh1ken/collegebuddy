const User = require('../models/auth.model');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const { privateUser } = require('../utils/serializers');

module.exports.user_profile = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...req.body, profileCompleted: true },
    { returnDocument: 'after', runValidators: true }
  );
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return sendSuccess(res, { message: 'Profile updated successfully', data: { user: privateUser(user) } });
};

module.exports.getCurrentUser = async (req, res) => sendSuccess(res, {
  data: { user: privateUser(req.user), profileCompleted: req.user.profileCompleted },
});
