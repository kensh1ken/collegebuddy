const mongoose = require('mongoose');
const { env, assertServerEnvironment } = require('./config/env');
const { connectDatabase } = require('./config/database');

async function start() {
  assertServerEnvironment();
  const app = require('./app');
  await connectDatabase();
  console.log('MongoDB connected');

  const server = app.listen(env.port, () => {
    console.log(`CollegeBuddy API listening on port ${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received; shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('Failed to start CollegeBuddy API:', error.message);
  process.exit(1);
});

