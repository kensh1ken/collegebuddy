const LostFound = require('../models/lostAndFound.model');
const storage = require('../services/storage.service');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const owns = (report, user) => String(report.postedBy?._id || report.postedBy) === String(user._id);

module.exports.createPost = async (req, res) => {
  const image = req.file ? await storage.uploadLostFoundImage(req.file, req.user._id) : {};
  try {
    const report = await LostFound.create({ ...req.body, ...image, postedBy: req.user._id });
    return sendSuccess(res, { status: 201, message: 'Report created', data: { report } });
  } catch (error) {
    if (image.imageStoragePath) await storage.deleteLostFoundImage(image.imageStoragePath).catch(() => {});
    throw error;
  }
};

module.exports.getAllPost = async (req, res) => {
  const { page, limit, search, ...query } = req.query;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ title: pattern }, { description: pattern }, { location: pattern }];
  }
  const [items, total] = await Promise.all([
    LostFound.find(query).select('-contactNumber').populate('postedBy', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    LostFound.countDocuments(query),
  ]);
  return sendSuccess(res, { data: { items, reports: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
};

module.exports.getSinglePost = async (req, res) => {
  const report = await LostFound.findById(req.params.id).populate('postedBy', 'name');
  if (!report) throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found');
  return sendSuccess(res, { data: { report } });
};

module.exports.getMyPosts = async (req, res) => {
  const reports = await LostFound.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, { data: { items: reports, reports, report: reports } });
};

module.exports.updatePost = async (req, res) => {
  const report = await LostFound.findById(req.params.id);
  if (!report) throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found');
  if (req.user.role !== 'admin' && !owns(report, req.user)) throw new AppError(403, 'REPORT_FORBIDDEN', 'You can only update your own report');
  Object.assign(report, req.body);
  await report.save();
  return sendSuccess(res, { message: 'Report updated', data: { report } });
};

module.exports.deletePost = async (req, res) => {
  const report = await LostFound.findById(req.params.id).select('+imageStoragePath');
  if (!report) throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found');
  if (req.user.role !== 'admin' && !owns(report, req.user)) throw new AppError(403, 'REPORT_FORBIDDEN', 'You can only delete your own report');
  if (report.imageStoragePath) await storage.deleteLostFoundImage(report.imageStoragePath);
  await report.deleteOne();
  return sendSuccess(res, { message: 'Report deleted' });
};
