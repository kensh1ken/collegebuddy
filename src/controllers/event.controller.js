const Event = require('../models/event.model');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports.createEvent = async (req, res) => {
  const event = await Event.create({ ...req.body, createdBy: req.user._id });
  return sendSuccess(res, { status: 201, message: 'Event created', data: { event } });
};

module.exports.getEvents = async (req, res) => {
  const { page, limit, search, upcoming, ...query } = req.query;
  if (upcoming) query.eventDate = { $gte: new Date() };
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$or = [{ title: pattern }, { description: pattern }, { organizer: pattern }, { location: pattern }];
  }
  const [items, total] = await Promise.all([
    Event.find(query).sort({ eventDate: 1 }).skip((page - 1) * limit).limit(limit),
    Event.countDocuments(query),
  ]);
  return sendSuccess(res, { data: { items, events: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
};

module.exports.getEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  return sendSuccess(res, { data: { event } });
};

module.exports.updateEvent = async (req, res) => {
  const current = await Event.findById(req.params.id);
  if (!current) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  const start = req.body.eventDate || current.eventDate;
  if (req.body.endDate && req.body.endDate < start) throw new AppError(400, 'INVALID_EVENT_DATES', 'End date cannot be before the start date');
  if (req.body.registrationDeadline && req.body.registrationDeadline > start) throw new AppError(400, 'INVALID_EVENT_DATES', 'Registration must close before the event starts');
  Object.assign(current, req.body);
  await current.save();
  return sendSuccess(res, { message: 'Event updated', data: { event: current } });
};

module.exports.deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) throw new AppError(404, 'EVENT_NOT_FOUND', 'Event not found');
  return sendSuccess(res, { message: 'Event deleted' });
};
