class SystemError extends Error {
  constructor(msg, statusCode = 500, details = null) {
    super(msg);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const handleNotFoundRoute = (req, res, next) => {
  const err = new SystemError(`Path ${req.originalUrl} was not found on this server`, 404);
  next(err);
};

const handleGlobalError = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let responseMsg = err.message || 'An internal server issue occurred';
  let issues = err.details || null;

  if (err.name === 'ValidationError') {
    status = 400;
    responseMsg = 'Validation failed';
    issues = Object.values(err.errors || {}).map((item) => item.message);
  } else if (err.code === 11000) {
    status = 400;
    const duplicatedKeys = Object.keys(err.keyValue || {});
    responseMsg = `Duplicate entry for: ${duplicatedKeys.join(', ')}`;
  } else if (err.name === 'CastError') {
    status = 400;
    responseMsg = `Invalid resource identifier: ${err.value}`;
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    responseMsg = 'Authorization credential rejected';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    responseMsg = 'Session has expired';
  }

  res.status(status).json({
    success: false,
    message: responseMsg,
    errors: issues
  });
};

module.exports = {
  SystemError,
  handleNotFoundRoute,
  handleGlobalError
};
