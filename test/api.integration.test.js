const { before, after, beforeEach, test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.API_RATE_LIMIT_MAX = '5000';
process.env.AUTO_APPROVE_RESOURCES = 'false';

let mongo;
let request;
let app;
let User;

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongo.getUri();
  app = require('../src/app');
  User = require('../src/models/auth.model');
  await mongoose.connect(process.env.MONGO_URI);
  request = require('supertest');
});

after(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

async function signup(email, name = 'Student') {
  return request(app).post('/api/auth/signup').send({ name, email, password: 'SecurePass123!' });
}

async function createUsers() {
  const studentResponse = await signup('student@iiitg.ac.in');
  const otherResponse = await signup('other@iiitg.ac.in', 'Other Student');
  const adminResponse = await signup('admin@iiitg.ac.in', 'Administrator');
  await User.updateOne({ email: 'admin@iiitg.ac.in' }, { role: 'admin' });
  return {
    student: studentResponse.body.token,
    other: otherResponse.body.token,
    admin: adminResponse.body.token,
    studentId: studentResponse.body.user._id,
    otherId: otherResponse.body.user._id,
  };
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

test('signup validates domain/password, prevents duplicates, and never returns password hashes', async () => {
  const invalidDomain = await request(app).post('/api/auth/signup').send({ name: 'Bad', email: 'badexampleiiitg.ac.in', password: 'SecurePass123!' });
  assert.equal(invalidDomain.status, 400);
  const weak = await request(app).post('/api/auth/signup').send({ name: 'Weak', email: 'weak@iiitg.ac.in', password: 'short' });
  assert.equal(weak.status, 400);
  const created = await signup('safe@iiitg.ac.in');
  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);
  assert.equal(created.body.user.password, undefined);
  const duplicate = await signup('safe@iiitg.ac.in');
  assert.equal(duplicate.status, 409);
});

test('login uses generic failures and invalid or expired tokens are rejected', async () => {
  await signup('login@iiitg.ac.in');
  const wrongEmail = await request(app).post('/api/auth/login').send({ email: 'missing@iiitg.ac.in', password: 'SecurePass123!' });
  const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'login@iiitg.ac.in', password: 'WrongPass123!' });
  assert.equal(wrongEmail.body.error.message, 'Invalid email or password');
  assert.equal(wrongPassword.body.error.message, 'Invalid email or password');
  const invalid = await request(app).get('/users/me').set(bearer('not-a-token'));
  assert.equal(invalid.status, 401);
  const user = await User.findOne({ email: 'login@iiitg.ac.in' });
  const expiredToken = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: -1 });
  const expired = await request(app).get('/users/me').set(bearer(expiredToken));
  assert.equal(expired.status, 401);
});

test('student/admin authorization and blocked-session enforcement work', async () => {
  const users = await createUsers();
  const studentDenied = await request(app).get('/admin/users').set(bearer(users.student));
  assert.equal(studentDenied.status, 403);
  const adminAllowed = await request(app).get('/admin/users').set(bearer(users.admin));
  assert.equal(adminAllowed.status, 200);
  const blocked = await request(app).patch(`/admin/users/${users.studentId}/block`).set(bearer(users.admin));
  assert.equal(blocked.status, 200);
  const blockedSession = await request(app).get('/users/me').set(bearer(users.student));
  assert.equal(blockedSession.status, 403);
});

test('resources support validation, ownership, moderation, filtering, pagination, and link downloads', async () => {
  const users = await createUsers();
  const invalid = await request(app).post('/resources').set(bearer(users.student)).send({ title: '', courseId: 'CS201', semester: 99, resourceType: 'notes', deliveryType: 'link' });
  assert.equal(invalid.status, 400);
  const spoofedFile = await request(app).post('/resources').set(bearer(users.student))
    .field('title', 'Spoofed PDF').field('courseId', 'CS201').field('semester', '3').field('resourceType', 'notes')
    .attach('file', Buffer.from('this is not a pdf'), { filename: 'notes.pdf', contentType: 'application/pdf' });
  assert.equal(spoofedFile.status, 400);
  assert.equal(spoofedFile.body.error.code, 'INVALID_FILE_CONTENT');
  const created = await request(app).post('/resources').set(bearer(users.student)).send({ title: 'Algorithms notes', description: 'Dynamic programming', courseId: 'CS201', semester: 3, academicYear: '2025-26', resourceType: 'notes', deliveryType: 'link', externalLink: 'https://example.edu/notes' });
  assert.equal(created.status, 201);
  assert.equal(created.body.resource.status, 'pending');
  const id = created.body.resource._id;
  const ownershipViolation = await request(app).patch(`/resources/${id}`).set(bearer(users.other)).send({ title: 'Hijacked' });
  assert.equal(ownershipViolation.status, 403);
  const moderated = await request(app).patch(`/admin/resources/${id}/moderate`).set(bearer(users.admin)).send({ status: 'approved' });
  assert.equal(moderated.status, 200);
  const listing = await request(app).get('/resources?search=Algorithms&semester=3&page=1&limit=10').set(bearer(users.other));
  assert.equal(listing.status, 200);
  assert.equal(listing.body.data.items.length, 1);
  assert.equal(listing.body.data.pagination.total, 1);
  const download = await request(app).get(`/resources/${id}/download`).set(bearer(users.other));
  assert.equal(download.body.data.download.url, 'https://example.edu/notes');
});

test('lost-and-found enforces ownership, validates IDs, and supports lifecycle/deletion', async () => {
  const users = await createUsers();
  const created = await request(app).post('/lost-found').set(bearer(users.student)).field('title', 'Blue bottle').field('description', 'Left near library').field('category', 'Other').field('type', 'Lost').field('location', 'Library');
  assert.equal(created.status, 201);
  const id = created.body.report._id;
  const forbidden = await request(app).patch(`/lost-found/${id}`).set(bearer(users.other)).send({ status: 'Claimed' });
  assert.equal(forbidden.status, 403);
  const resolved = await request(app).patch(`/lost-found/${id}`).set(bearer(users.student)).send({ status: 'Resolved' });
  assert.equal(resolved.status, 200);
  const invalidId = await request(app).get('/lost-found/not-an-id').set(bearer(users.student));
  assert.equal(invalidId.status, 400);
  const removed = await request(app).delete(`/lost-found/${id}`).set(bearer(users.student));
  assert.equal(removed.status, 200);
});

test('events are public to read and admin-only to mutate', async () => {
  const users = await createUsers();
  const payload = { title: 'Hack Night', eventDate: new Date(Date.now() + 86400000).toISOString(), type: 'hackathon', registrationUrl: 'https://example.edu/register' };
  const denied = await request(app).post('/events').set(bearer(users.student)).send(payload);
  assert.equal(denied.status, 403);
  const created = await request(app).post('/events').set(bearer(users.admin)).send(payload);
  assert.equal(created.status, 201);
  const id = created.body.event._id;
  const listed = await request(app).get('/events?upcoming=true&page=1&limit=10');
  assert.equal(listed.status, 200);
  assert.equal(listed.body.data.items.length, 1);
  const updated = await request(app).patch(`/events/${id}`).set(bearer(users.admin)).send({ location: 'Auditorium' });
  assert.equal(updated.status, 200);
  const removed = await request(app).delete(`/events/${id}`).set(bearer(users.admin));
  assert.equal(removed.status, 200);
});
