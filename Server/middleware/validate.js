const ApiError = require('../utils/ApiError');

/**
 * Validates request payload against Zod schema
 * @param {import('zod').ZodSchema} schema
 */
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Replace with sanitized/coerced values
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        const issues = error.issues || [];
        const formattedErrors = issues.map((i) => ({
          field: i.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
          message: i.message
        }));

        const primaryMessage = formattedErrors[0]
          ? `${formattedErrors[0].field ? formattedErrors[0].field + ': ' : ''}${formattedErrors[0].message}`
          : 'Validation failed';

        return next(new ApiError(400, primaryMessage, formattedErrors));
      }
      next(error);
    }
  };
};

module.exports = validate;
