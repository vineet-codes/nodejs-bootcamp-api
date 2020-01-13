const path = require("path");
const Bootcamp = require("./../models/Bootcamp");
const ErrorResponse = require("./../utils/errorResponse");
const asyncHandler = require("./../middleware/async");
const geocoder = require("./../utils/geocoder");

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get a bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // coustom error handling: for when id is mongo formatted but not in the database
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    create a new bootcamp
// @route   POST /api/v1/bootcamps/
// @access  private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({
    success: true,
    data: bootcamp
  });
});

// @desc    update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!bootcamp) {
    // coustom error handling: for when id is mongo formatted but not in the database
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: bootcamp });
});

// @desc    delete a bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // coustom error handling: for when id is mongo formatted but not in the database
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }
  bootcamp.remove();
  res.status(200).json({ success: true, data: {} });
});

// @desc    GET bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lang/lat from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const long = loc[0].longitude;

  // calc radius using radians
  // divide radius by radius of earth: Earth radius = 3963 mi / 6378 kms
  const radius = distance / 3963;
  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[long, lat], radius] } }
  });
  res
    .status(200)
    .json({ success: true, count: bootcamps.length, data: bootcamps });
});

// @desc    Upload photo for bootcamp
// @route   PUT /api/v1/bootcamps/:id/photo
// @access  private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    // coustom error handling: for when id is mongo formatted but not in the database
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  // console.log(req.files);
  const file = req.files.file;

  // Make sure image is the photo
  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload a image file`, 400));
  }

  // check file size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // create a coustom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  // move the file
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(error);
      return next(new ErrorResponse("Problem with file upload", 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({ success: true, data: file.name });
  });
});
