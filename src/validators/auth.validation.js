const { z, nonEmpty } = require("./common.validation");

const collegeEmail = z.string().trim().toLowerCase().email().regex(/^[^@\s]+@iiitg\.ac\.in$/, "Use a valid IIITG college email");
const password = z.string().min(8, "Password must be at least 8 characters").max(128);

const signup = z.object({
  name: nonEmpty("Name", 100),
  email: collegeEmail,
  password,
}).strict();

const login = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
}).strict();

const completeProfile = z.object({
  currentSem: z.coerce.number().int().min(1).max(12),
  branch: nonEmpty("Branch", 100),
  rollNumber: z.union([z.string(), z.number()]).transform(String).pipe(z.string().trim().min(1).max(30)),
  course: nonEmpty("Course", 100),
}).strict();

module.exports = { signup, login, completeProfile };
