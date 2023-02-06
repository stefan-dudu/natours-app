const AppError = require('../Utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} is ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another name!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data with the followings: ${errors.join(
    '. '
  )}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Busted! 💥🟦💥', 401);

const handleJWTExpiredToken = () =>
  new AppError('Your token has expired. Please log in again 🔓', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // operationa trusted error:  send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    // progaming or other error : Not sent to client
  } else {
    // 1) log error
    console.error('ERROR MATE 🚅', err);
    // 2) send genric message
    res.status(500).json({
      status: 'error',
      message: 'Something went veery wrong - catch all message 🐈',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.satus || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredToken();
    error = sendErrorProd(error, res);
  }
};
