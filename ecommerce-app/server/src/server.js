/**
 * Process entry point.
 *
 * Responsibilities kept here and nowhere else: open the database connection,
 * bind the HTTP port, and shut both down cleanly.
 */
const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');

let server;

async function start() {
  try {
    await connectDB();

    server = app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', error.message);
    process.exit(1);
  }
}

/**
 * Graceful shutdown: stop accepting new connections, let in-flight requests
 * finish, then close the database pool. Killing the process immediately could
 * interrupt a write midway through a checkout.
 */
async function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[server] ${signal} received, shutting down...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[server] unhandled promise rejection:', reason);
  shutdown('unhandledRejection');
});

start();
