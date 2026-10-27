/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Resource ${req.method} ${req.originalUrl} not found on this server.`
  });
};

module.exports = notFound;
