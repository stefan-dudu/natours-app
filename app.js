const express = require('express');
const morgan = require('morgan');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//  1)  MIDDLEWARES
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('hello from the middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
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
