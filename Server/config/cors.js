/**
 * CORS Configuration
 * Permits exact production frontend origin and local development origins with credentials support.
 * Explicitly rejects unauthorized origins and prohibits wildcard '*' in production.
 */
const getAllowedOrigins = () => {
  const envSources = [process.env.CLIENT_URL, process.env.FRONTEND_URL].filter(Boolean);
  const envUrls = envSources
    .flatMap((val) => val.split(','))
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const defaults = [
    // Exact production frontend deployment
    'https://hotelpro-1frontend.onrender.com',
    // Local development origins
    'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  return Array.from(new Set([...envUrls, ...defaults]));
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server health checks)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');

    // In development mode, dynamically permit any localhost or 127.0.0.1 port (e.g. 5174, 5173, 3000)
    if (process.env.NODE_ENV !== 'production') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
        return callback(null, true);
      }
    }

    const allowed = getAllowedOrigins();
    if (allowed.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Reject non-allowed origins cleanly without crashing server or granting access
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Razorpay-Signature',
    'Cache-Control',
    'Range'
  ],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 204
};

module.exports = {
  corsOptions,
  getAllowedOrigins
};
