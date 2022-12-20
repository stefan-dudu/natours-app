const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Error string for name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal to 40 charaters'],
      minlength: [10, 'A tour name must have more or equal to 10 charaters'],
      // validate: [validator.isAlpha, 'Only characters are allowed'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a dificulty'],
      enum: {
        //only for strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Choose just from the defined values',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // This validator is going to work only on new document, as this keyword does not work on  UPDATE
          return val < this.price;
        },
        message:
          'Discounted price ({VALUE}) cannot be higher than actual price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    descirption: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// VIRTUAL PROPERTY : used for computations
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// MIDDLEWARES : -----------------

// 1) DOCUMENT mw : runs before .save() and the .create() but NOT before insertMany()
tourSchema.pre('save', function (next) {
  // console.log('document', this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('will save doc');
//   next();
// });

// // eslint-disable-next-line prefer-arrow-callback
// tourSchema.post('save', function (doc, next) {
//   console.log('doc', doc);
//   next();
// });

// 2) QUERY mw:
tourSchema.pre(/^find/, function (next) {
  // console.log('query', this);
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`time it took to query : ${Date.now() - this.start} ms`);
  next();
});

// 3) AGGREGATION mw :

tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
