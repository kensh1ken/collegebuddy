const { z, objectId, nonEmpty, optionalText, optionalUrl, pagination } = require('./common.validation');

const resourceTypes = z.enum(['notes', 'previous_year_paper', 'assignment', 'lab_material', 'question_bank', 'study_material', 'external_link', 'file', 'link']);
const examTypes = z.enum(['midsem', 'endsem', 'quiz', 'practical', 'other', 'none']);

const fields = {
  title: nonEmpty('Title', 200),
  description: optionalText(2000),
  courseId: nonEmpty('Course code', 30).transform((value) => value.toUpperCase()),
  semester: z.coerce.number().int().min(1).max(12),
  academicYear: z.string().trim().regex(/^\d{4}(-\d{2,4})?$/, 'Use an academic year such as 2025-26').optional().default(''),
  resourceType: resourceTypes.default('notes'),
  deliveryType: z.enum(['file', 'link']).optional(),
  examType: examTypes.default('none'),
  externalLink: optionalUrl,
};
const create = z.object(fields).strict().superRefine((value, context) => {
  const delivery = value.deliveryType || (value.resourceType === 'link' || value.resourceType === 'external_link' ? 'link' : 'file');
  if (delivery === 'link' && !value.externalLink) {
    context.addIssue({ code: 'custom', path: ['externalLink'], message: 'An HTTP(S) link is required' });
  }
});

const update = z.object(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])))
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required');
const params = z.object({ id: objectId });
const list = z.object({
  search: z.string().trim().max(100).optional(),
  course: z.string().trim().max(30).optional(),
  courseId: z.string().trim().max(30).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  academicYear: z.string().trim().max(9).optional(),
  resourceType: resourceTypes.optional(),
  examType: examTypes.optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  ...pagination,
}).strict();
const moderate = z.object({
  status: z.enum(['approved', 'rejected']),
  moderationNote: z.string().trim().max(500).optional().default(''),
}).strict();

module.exports = { create, update, params, list, moderate };
