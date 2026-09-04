const { z, objectId, nonEmpty, pagination } = require('./common.validation');

const fields = {
  code: nonEmpty('Course code', 30).transform((value) => value.toUpperCase()),
  name: nonEmpty('Course name', 150),
  semester: z.coerce.number().int().min(1).max(12),
  department: nonEmpty('Department', 100),
  credits: z.coerce.number().min(0).max(30).optional(),
  active: z.boolean().optional(),
};

const create = z.object(fields).strict();
const update = z.object(fields).partial().strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
const params = z.object({ id: objectId });
const list = z.object({
  search: z.string().trim().max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  department: z.string().trim().max(100).optional(),
  active: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  ...pagination,
}).strict();

module.exports = { create, update, params, list };
