const Course = require("./../models/Course");
const Bootcamp = require("./../models/Bootcamp");
const ErrorResponse = require("./../utils/errorResponse");
const asyncHandler = require("./../middleware/async");

// @desc    Get courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampID/courses
// @access  public
exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    res
      .status(200)
      .json({ success: true, count: courses.length, data: courses });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get a sing course
// @route   GET /api/v1/courses/:id
// @access  public
exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description"
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Add course
// @route   POST /api/v1/bootcamps/:bootcampId/courses/
// @access  private
exports.addCourse = asyncHandler(async (req, res, next) => {
  // check to see if bootcamp exists. If not return error
  req.body.bootcamp = req.params.bootcampId;
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) {
    return new ErrorResponse(
      `No bootcamp with id of ${req.params.bootcampId}`,
      404
    );
  }

  // create a course
  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Update a course
// @route   PUT /api/v1/courses/:id
// @access  private
exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) {
    return new ErrorResponse(`No course with id of ${req.params.id}`, 404);
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete a course
// @route   DELETE /api/v1/courses/:id
// @access  private
exports.deleteCourse = asyncHandler(async (req, res, next) => {
  // console.log("Reached Here");
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`, 404)
    );
  }

  // console.log(course);
  // // doing this way so that we can use middleware: otherwise use findByIdandDelete
  // console.log(course.remove());
  await course.remove(); //Course.remove({ _id: req.params.id });

  // console.log("Reached Here");
  res.status(200).json({
    success: true,
    data: {}
  });
});
