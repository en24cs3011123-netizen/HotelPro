const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { connectDatabase, disconnectDatabase } = require('./config/db');
const { seedDemoAccounts } = require('./services/seedService');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

/**
 * Initializes Database connection and launches HTTP server
 */
const startServer = async () => {
  try {
    // 1. Establish database connection before accepting HTTP requests
    console.log('[HotelPro Server] Connecting to MongoDB database...');
    await connectDatabase();

    // 2. Auto-seed verified demo accounts if needed
    await seedDemoAccounts();

    // 3. Start HTTP Server only after successful DB connection
    server = app.listen(PORT, () => {
      console.log(`[HotelPro Server] Listening on http://localhost:${PORT}`);
      console.log(`[HotelPro Server] Environment: ${NODE_ENV}`);
      console.log(`[HotelPro Server] Health Check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error(`[HotelPro Server] Fatal: Initial database connection failed: ${error.message}`);

    // If explicit offline/testing mode is enabled, allow server to run standalone
    if (process.env.ALLOW_OFFLINE_STANDALONE === 'true') {
      console.warn('[HotelPro Server] Running in standalone development mode (ALLOW_OFFLINE_STANDALONE=true).');
      server = app.listen(PORT, () => {
        console.log(`[HotelPro Server] Standalone server active on http://localhost:${PORT}`);
      });
    } else {
      console.error('[HotelPro Server] Terminating process due to database connection failure.');
      process.exit(1);
    }
  }
};

/**
 * Graceful shutdown handling
 */
const shutdown = async (signal) => {
  console.log(`\n[HotelPro Server] ${signal} signal received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[HotelPro Server] HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });
  } else {
    await disconnectDatabase();
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
