const Course = require('../models/course.model');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports.list = async (req, res) => {
  const { page, limit, search, ...filters } = req.query;
  const query = { ...filters };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ code: pattern }, { name: pattern }];
  }
  const [items, total] = await Promise.all([
    Course.find(query).sort({ semester: 1, code: 1 }).skip((page - 1) * limit).limit(limit),
    Course.countDocuments(query),
  ]);
  return sendSuccess(res, { data: { items, courses: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
};

module.exports.create = async (req, res) => {
  const course = await Course.create(req.body);
  return sendSuccess(res, { status: 201, message: 'Course created', data: { course } });
};

module.exports.update = async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  return sendSuccess(res, { message: 'Course updated', data: { course } });
};

module.exports.remove = async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, { active: false }, { returnDocument: 'after' });
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', 'Course not found');
  return sendSuccess(res, { message: 'Course archived', data: { course } });
};
