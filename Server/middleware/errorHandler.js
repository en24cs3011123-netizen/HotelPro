/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Mongoose Disconnected / Buffering Error
  if (
    err.name === 'MongooseError' &&
    (err.message.includes('buffering timed out') || err.message.includes('before initial connection'))
  ) {
    statusCode = 503;
    message = 'Database service is currently offline or unreachable. Please verify MONGODB_URI in Server/.env.';
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid resource identifier: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (e.g. unique email or roomNumber)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists.`;
    errors = [{ field, message: `Duplicate value '${err.keyValue[field]}'` }];
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message
    }));
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please sign in again.';
  }

  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Invalid input data';
    errors = err.issues?.map((i) => ({
      field: i.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
      message: i.message
    })) || [];
  }

  // Format standardized JSON response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      errorName: err.name
    })
  });
};

module.exports = errorHandler;
