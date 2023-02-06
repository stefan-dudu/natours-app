const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//  1) GLOBAL MIDDLEWARES
// set securitiy http headers
app.use(helmet());
console.log(process.env.NODE_ENV);
// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// limit requests from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP. Try again over an hour!',
});
app.use('/api', limiter);

// body parser eading data from body into req.body
app.use(
  express.json({
    limit: '10kb',
  })
);

// Data sanitization against NoSQL QUERY INJECTION
app.use(mongoSantize());

// Data sanitization against XSS
app.use(xss());

// prevent prarameter polution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
// serving for static files
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('hello from the middleware');
//   next();
// });

// testing MW
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// gets run after the program initialization. Is a top level code, that does not block the stack, so we can use reafFileSync

//  2) ROUTE HANDLERS

// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createNewTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

//  3) ROUTES

// const userRouter = express.Router();

//  -- tours

//  -- users

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // if next recieves an arugments is FOR SURE an error
  next(new AppError(`Can't find ${req.originalUrl} on this server!!`, 404));
});

// if it has 4 params is an error handling mw
app.use(globalErrorHandler);

//  4) START SERVER
module.exports = app;
