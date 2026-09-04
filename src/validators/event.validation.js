const { z, objectId, nonEmpty, optionalText, optionalUrl, pagination } = require('./common.validation');

const eventTypes = z.enum(['hackathon', 'workshop', 'competition', 'seminar', 'other']);
const fields = {
  title: nonEmpty('Title', 200),
  description: optionalText(3000),
  organizer: z.string().trim().max(200).optional().default(''),
  eventDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  registrationDeadline: z.coerce.date().optional().nullable(),
  location: z.string().trim().max(300).optional().default(''),
  registrationUrl: optionalUrl,
  imageUrl: optionalUrl,
  type: eventTypes.default('other'),
};
const create = z.object(fields).strict().superRefine((value, context) => {
  if (value.endDate && value.endDate < value.eventDate) context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date cannot be before the start date' });
  if (value.registrationDeadline && value.registrationDeadline > value.eventDate) context.addIssue({ code: 'custom', path: ['registrationDeadline'], message: 'Registration must close before the event starts' });
});
const update = z.object(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()]))).strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one field is required')
  .superRefine((value, context) => {
    if (value.endDate && value.eventDate && value.endDate < value.eventDate) context.addIssue({ code: 'custom', path: ['endDate'], message: 'End date cannot be before the start date' });
    if (value.registrationDeadline && value.eventDate && value.registrationDeadline > value.eventDate) context.addIssue({ code: 'custom', path: ['registrationDeadline'], message: 'Registration must close before the event starts' });
  });

const params = z.object({ id: objectId });
const list = z.object({
  search: z.string().trim().max(100).optional(),
  type: eventTypes.optional(),
  upcoming: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  ...pagination,
}).strict();

module.exports = { create, update, params, list };
