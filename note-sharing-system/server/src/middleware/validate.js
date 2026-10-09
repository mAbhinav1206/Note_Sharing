const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * validate() wraps an array of express-validator chains.
 * Usage:  router.post('/login', validate([ body('email').isEmail() ]), controller)
 *
 * It runs every chain, and if any check fails it forwards a 400 AppError
 * with a list of { field, message } objects that the frontend can show
 * next to the correct input.
 */
const validate = (validations) => async (req, _res, next) => {
  for (const validation of validations) {
    await validation.run(req);
  }

  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(new AppError('Validation failed', 400, errors));
};

module.exports = validate;
