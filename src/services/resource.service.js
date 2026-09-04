const Notes = require('../models/notes.model');
const Course = require('../models/course.model');
const AppError = require('../utils/AppError');
const { env } = require('../config/env');
const storage = require('./storage.service');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isOwner = (resource, user) => String(resource.uploadedBy?._id || resource.uploadedBy) === String(user._id);

function normalizeCreateInput(body) {
  const legacyDelivery = ['file', 'link'].includes(body.resourceType) ? body.resourceType : undefined;
  const deliveryType = body.deliveryType || legacyDelivery || (body.resourceType === 'external_link' ? 'link' : 'file');
  return {
    ...body,
    deliveryType,
    resourceType: legacyDelivery ? (legacyDelivery === 'link' ? 'external_link' : 'notes') : body.resourceType,
    externalLink: deliveryType === 'link' ? body.externalLink : undefined,
  };
}

async function resolveCourse(code) {
  return Course.findOne({ code: code.toUpperCase(), active: true });
}

async function create(body, file, user) {
  const input = normalizeCreateInput(body);
  if (input.deliveryType === 'file' && !file) {
    throw new AppError(400, 'FILE_REQUIRED', 'A resource file is required');
  }
  if (input.deliveryType === 'link' && file) {
    throw new AppError(400, 'UNEXPECTED_FILE', 'A file cannot be attached to a link resource');
  }
  const course = await resolveCourse(input.courseId);
  const fileMetadata = file ? await storage.uploadResource(file, user._id) : {};
  try {
    return await Notes.create({
      ...input,
      course: course?._id,
      ...fileMetadata,
      uploadedBy: user._id,
      status: env.autoApproveResources || user.role === 'admin' ? 'approved' : 'pending',
    });
  } catch (error) {
    if (fileMetadata.storagePath) await storage.deleteResourceFile(fileMetadata.storagePath).catch(() => {});
    throw error;
  }
}

async function list(queryInput, user) {
  const { page, limit, search, course, courseId, ...filters } = queryInput;
  const query = { ...filters };
  const code = course || courseId;
  if (code) query.courseId = code.toUpperCase();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    query.$and = [{ $or: [{ title: pattern }, { description: pattern }, { courseId: pattern }] }];
  }
  if (user.role !== 'admin') {
    const visibility = query.status
      ? { status: query.status, uploadedBy: user._id }
      : { $or: [{ status: 'approved' }, { status: { $exists: false } }, { uploadedBy: user._id }] };
    delete query.status;
    query.$and = [...(query.$and || []), visibility];
  }
  const [items, total] = await Promise.all([
    Notes.find(query)
      .populate('course', 'code name semester department credits')
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notes.countDocuments(query),
  ]);
  return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
}

async function findAuthorized(id, user, { includeStorage = false } = {}) {
  let query = Notes.findById(id);
  if (includeStorage) query = query.select('+storagePath +fileUrl');
  const resource = await query.populate('course', 'code name semester department credits').populate('uploadedBy', 'name role');
  if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  if (resource.status !== 'approved' && user.role !== 'admin' && !isOwner(resource, user)) {
    throw new AppError(403, 'RESOURCE_FORBIDDEN', 'You cannot access this resource');
  }
  return resource;
}

async function update(id, body, user) {
  const resource = await Notes.findById(id).select('+storagePath');
  if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  if (user.role !== 'admin' && !isOwner(resource, user)) throw new AppError(403, 'RESOURCE_FORBIDDEN', 'You can only update your own resources');
  const input = normalizeCreateInput({ ...resource.toObject(), ...body });
  const allowed = ['title', 'description', 'courseId', 'semester', 'academicYear', 'resourceType', 'examType', 'externalLink'];
  for (const key of allowed) if (Object.hasOwn(body, key)) resource[key] = input[key];
  if (body.courseId) resource.course = (await resolveCourse(body.courseId))?._id;
  if (user.role !== 'admin') resource.status = env.autoApproveResources ? 'approved' : 'pending';
  await resource.save();
  return resource;
}

async function remove(id, user) {
  const resource = await Notes.findById(id).select('+storagePath');
  if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  if (user.role !== 'admin' && !isOwner(resource, user)) throw new AppError(403, 'RESOURCE_FORBIDDEN', 'You can only delete your own resources');
  if (resource.storagePath) await storage.deleteResourceFile(resource.storagePath);
  await resource.deleteOne();
}

async function moderate(id, input, admin) {
  const resource = await Notes.findByIdAndUpdate(id, {
    status: input.status,
    moderationNote: input.moderationNote,
    moderatedBy: admin._id,
    moderatedAt: new Date(),
  }, { returnDocument: 'after', runValidators: true });
  if (!resource) throw new AppError(404, 'RESOURCE_NOT_FOUND', 'Resource not found');
  return resource;
}

async function getDownload(id, user) {
  const resource = await findAuthorized(id, user, { includeStorage: true });
  if (resource.deliveryType === 'link' || resource.resourceType === 'link') {
    return { url: resource.externalLink, expiresIn: null };
  }
  if (resource.storagePath) {
    return { url: await storage.createResourceDownloadUrl(resource.storagePath), expiresIn: env.signedUrlTtlSeconds };
  }
  if (resource.fileUrl) return { url: resource.fileUrl, expiresIn: null, legacy: true };
  throw new AppError(404, 'RESOURCE_FILE_NOT_FOUND', 'This resource has no stored file');
}

module.exports = { create, list, findAuthorized, update, remove, moderate, getDownload };
