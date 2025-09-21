const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return next(new AppError('Validation failed', 400, formattedErrors));
  }
  next();
};

const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('handicap')
    .optional()
    .isFloat({ min: -10, max: 54 })
    .withMessage('Handicap must be between -10 and 54'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  handleValidationErrors
];

const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const validateClubData = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Club name is required and must be less than 100 characters'),
  body('type')
    .isIn(['driver', 'fairway_wood', 'hybrid', 'iron', 'wedge', 'putter'])
    .withMessage('Invalid club type'),
  body('loft')
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage('Loft must be between 0 and 90 degrees'),
  body('averageDistance')
    .optional()
    .isInt({ min: 0, max: 400 })
    .withMessage('Average distance must be between 0 and 400 yards'),
  handleValidationErrors
];

const validateCalculationInput = [
  body('distance')
    .isInt({ min: 1, max: 600 })
    .withMessage('Distance must be between 1 and 600 yards'),
  body('wind.speed')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Wind speed must be between 0 and 50 mph'),
  body('wind.direction')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Wind direction must be between 0 and 360 degrees'),
  body('elevation')
    .optional()
    .isInt({ min: -100, max: 100 })
    .withMessage('Elevation change must be between -100 and 100 feet'),
  body('lie')
    .optional()
    .isIn(['fairway', 'rough', 'sand', 'fringe', 'tee', 'hazard'])
    .withMessage('Invalid lie condition'),
  body('pin_position')
    .optional()
    .isIn(['front', 'middle', 'back'])
    .withMessage('Pin position must be front, middle, or back'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('handicap')
    .optional()
    .isFloat({ min: -10, max: 54 })
    .withMessage('Handicap must be between -10 and 54'),
  body('skillLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'professional'])
    .withMessage('Invalid skill level'),
  handleValidationErrors
];

const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordReset,
  validatePasswordUpdate,
  validateClubData,
  validateCalculationInput,
  validateProfileUpdate,
  validateUUID,
  validatePagination,
  handleValidationErrors
};