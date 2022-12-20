const Tour = require('../models/tourModel');
const APIFeatures = require('../Utils/apiFeatures');

//  in here is the middleware

exports.aliasTopTours = (req, res, next) => {
  // limit=5&sort=-ratingsAverage,price
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratigsAverage, summary, difficulty';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    // THE LONGER VERSION BEFORE REFACTORING AND USING CLASSES
    // A. EXECUTE QUERY
    // 1A) Filtering

    // ONE WAY OF FILTERING - BASIC
    // const query = await Tour.find({
    //   duration: 5,
    //   difficulty: 'easy',
    // });
    // ------- or -------
    // MONGOOSE FILTERING METHOD
    // const query = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');

    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((el) => delete queryObj[el]);

    // // 1B) Advanced filtering
    // // adding $ for fitlering on  >= , > , <= , <
    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // let query = Tour.find(JSON.parse(queryStr));

    // 2) SORTING

    // if (req.query.sort) {
    //   const sortBy = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortBy);
    // } else {
    //   // if no sorting we are going to sort by createdAt, ascending thanx to -
    //   query = query.sort('-createdAt');
    // }

    // 3) FIELD LIMITING

    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   console.log('test', req.query.fields);
    //   query = query.select(fields);
    // } else {
    //   // here the - excludes. So we get everything except __v
    //   query = query.select('-__v');
    // }

    // 4) Pagination
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;
    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   // console.log('numTours', numTours);
    //   // console.log('limit', limit);
    //   // console.log('page', page);
    //   if (skip >= numTours) {
    //     throw new Error('over the limit');
    //   }
    // }

    // B. EXECUTE QUERY
    const features = new APIFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const tours = await features.query;

    // C. SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    // Tour.findOne({ _id: req.params.id }) === Tour.findById(req.params.id);
    const tour = await Tour.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.createNewTour = async (req, res) => {
  try {
    // basic solution
    // const newTours = new Tour({});
    // newTours.save()

    // easier solution
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: `Invalid data sent, ${err}`,
    });
    // console.log('THERE WAS AN ERROR 💥', err);
  }
};

exports.updateTour = async (req, res) => {
  try {
    // query for the doc we want to update and update it.

    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'Failed',
      message: 'Invalid data sent',
      details: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  await Tour.findByIdAndDelete(req.params.id);
  try {
    res.status(204).json({
      status: 'success',
      message: 'all done',
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid data sent - delete',
      details: err,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      { $match: { ratingsAverage: { $gte: 4.5 } } },
      {
        $group: {
          _id: { $toUpper: '$difficulty' },
          // this is how is written with $ in '' not ``
          numTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      { $sort: { avgPrice: 1 } },
      // { $match: { _id: { $ne: 'easy' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid data sent - delete',
      details: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
    // console.log('test');
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      { $unwind: '$startDates' },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      { $addFields: { month: '$_id' } },
      { $project: { _id: 0 } },
      { $sort: { numTourStarts: -1 } },
      { $limit: 12 },
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'Failed',
      message: 'Invalid data sent - delete',
      details: err,
    });
  }
};
