const Review = require("./../models/Review");
const Bootcamp = require("./../models/Bootcamp");
const ErrorResponse = require("./../utils/errorResponse");
const asyncHandler = require("./../middleware/async");

// @desc    Get reviews
// @route   GET /api/v1/reviews
// @route   GET /api/v1/bootcamps/:bootcampID/reviews
// @access  public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });
    res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get a single review
// @route   GET /api/v1/reviews/:id
// @access  public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description"
  });

  // check to see if review exists
  if (!review) {
    return next(
      new ErrorResponse(`No review with id of ${req.params.id} found`, 404)
    );
  }

  res.status(200).json({ success: true, data: review });
});

// @desc    Add a single review to the bootcamp
// @route   POST /api/v1/bootcamps/:bootcampId/reviews
// @access  private
exports.AddReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  console.log(req.user);

  const bootcamp = Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `No bootcamp found with id: ${req.params.bootcampId}`,
        404
      )
    );
  }

  const review = await Review.create(req.body);

  res.status(201).json({ success: true, data: review });
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No with review with id of ${req.params.id} found`, 404)
    );
  }

  // make sure the user owns the review or the user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`Not authorized to update the review`, 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: review });
});

// @desc      Delete review
// @route     DELETE /api/v1/reviews/:id
// @access    Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {}
  });
});
