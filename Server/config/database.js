/**
 * HotelPro — MongoDB & Mongoose Database Connection Manager
 * 
 * Implements resilient connection lifecycle management, credential masking,
 * automatic reconnect handling, and graceful shutdown.
 */

const mongoose = require('mongoose');

// Configure Mongoose global behaviors
mongoose.set('bufferCommands', false); // Fail fast rather than hanging when connection is lost
mongoose.set('autoIndex', process.env.NODE_ENV !== 'production');

/**
 * Safely masks database credentials for logging
 * @param {string} uri - MongoDB connection string
 * @returns {string} Sanitized connection URI
 */
const maskMongoUri = (uri) => {
  if (!uri) return '';
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
    '$1$2:******@'
  );
};

/**
 * Validates and retrieves the MongoDB URI from environment variables
 */
const getMongoUri = () => {
  return process.env.MONGODB_URI || process.env.MONGODB_CONNECTION_LINK;
};

let listenersAttached = false;

/**
 * Attaches Mongoose connection lifecycle listeners
 */
const attachConnectionListeners = () => {
  if (listenersAttached) return;

  mongoose.connection.on('connected', () => {
    console.log('[Database] Mongoose event: Connected to MongoDB.');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[Database] Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] Mongoose connection lost / disconnected.');
  });

  listenersAttached = true;
};

/**
 * Connects to MongoDB asynchronously
 * @param {string} [customUri] - Optional override URI (used in testing)
 * @returns {Promise<typeof mongoose>}
 */
const connectDatabase = async (customUri) => {
  const uri = customUri || getMongoUri();

  if (!uri) {
    const errorMsg = 'MONGODB_URI is not configured. Please define MONGODB_URI in Server/.env.';
    console.error(`[Database] Configuration Error: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  // If already connected, return existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  attachConnectionListeners();

  const maskedUri = maskMongoUri(uri);
  console.log(`[Database] Attempting connection to MongoDB at: ${maskedUri}`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // 5-second timeout for server selection
      connectTimeoutMS: 10000
    });

    console.log(`[Database] Connected to MongoDB successfully (${mongoose.connection.name || 'hotelpro'}).`);
    return mongoose;
  } catch (error) {
    console.error(`[Database] Initial MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

/**
 * Disconnects from MongoDB gracefully
 */
const disconnectDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB connection closed gracefully.');
  }
};

/**
 * Returns human-readable connection status
 */
const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDbStatus,
  maskMongoUri,
  getMongoUri
};
