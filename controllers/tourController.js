const Tour = require('../models/tourModel');

// used when we were having the local DB
// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

exports.getAllTours = async (req, res) => {
  try {
    // 1. EXECUTE QUERY
    // console.log('query', req.query);
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const query = await Tour.find(queryObj);

    console.log('query', typeof query);

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

    // 2. EXECUTE QUERY
    const tours = await query;

    // 3. SEND RESPONSE
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
