const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const nonEmpty = (label, max = 200) => z.string().trim().min(1, `${label} is required`).max(max);
const optionalText = (max = 2000) => z.string().trim().max(max).optional().default("");
const optionalUrl = z.union([z.literal(""), z.string().trim().url().refine((value) => /^https?:\/\//i.test(value), "URL must use http or https")]).optional();
const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

module.exports = { z, objectId, nonEmpty, optionalText, optionalUrl, pagination };
