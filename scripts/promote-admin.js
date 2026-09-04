const { assertServerEnvironment } = require('../src/config/env');
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/auth.model');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!/^[^@\s]+@iiitg\.ac\.in$/.test(email)) {
    throw new Error('Usage: npm run admin:promote -- person@iiitg.ac.in');
  }
  assertServerEnvironment();
  const connection = await connectDatabase();
  const user = await User.findOne({ email });
  if (!user) throw new Error('No user exists with that college email');
  if (user.isBlocked) throw new Error('Unblock the account before granting administrator access');
  user.role = 'admin';
  await user.save();
  console.log(`Administrator access granted to ${email}`);
  await connection.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
