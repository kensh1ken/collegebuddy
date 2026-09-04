const { z, objectId, nonEmpty, optionalText, pagination } = require('./common.validation');

const categories = z.enum(['Electronics', 'Books', 'ID Card', 'Wallet', 'Keys', 'Clothing', 'Accessories', 'Other', 'Others']);
const types = z.enum(['Lost', 'Found']);
const statuses = z.enum(['Open', 'Claimed', 'Resolved']);

const normalizeCategory = (value) => {
  const match = categories.options.find((item) => item.toLowerCase() === String(value).trim().toLowerCase());
  return match || value;
};

const create = z.object({
  title: nonEmpty('Title', 160),
  description: nonEmpty('Description', 2000),
  category: z.string().transform(normalizeCategory).pipe(categories),
  type: z.string().transform((value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()).pipe(types),
  location: nonEmpty('Location', 200),
  incidentDate: z.coerce.date().max(new Date(Date.now() + 24 * 60 * 60 * 1000)).optional(),
  contactNumber: z.string().trim().regex(/^\+?[0-9 -]{7,20}$/, 'Invalid contact number').optional().or(z.literal('')),
}).strict();
const update = z.object({
  title: nonEmpty('Title', 160).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  category: z.string().transform(normalizeCategory).pipe(categories).optional(),
  type: types.optional(),
  location: nonEmpty('Location', 200).optional(),
  incidentDate: z.coerce.date().max(new Date(Date.now() + 24 * 60 * 60 * 1000)).optional(),
  contactNumber: z.string().trim().regex(/^\+?[0-9 -]{7,20}$/).optional().or(z.literal('')),
  status: statuses.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
const params = z.object({ id: objectId });
const list = z.object({
  search: z.string().trim().max(100).optional(),
  type: types.optional(),
  category: categories.optional(),
  status: statuses.optional(),
  ...pagination,
}).strict();

module.exports = { create, update, params, list };
