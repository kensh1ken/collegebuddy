const { z, objectId, pagination } = require('./common.validation');

const params = z.object({ id: objectId });
const users = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['student', 'admin']).optional(),
  isBlocked: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  ...pagination,
}).strict();

module.exports = { params, users };
