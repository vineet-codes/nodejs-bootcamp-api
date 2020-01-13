const path = require("path");
const Bootcamp = require("./../models/Bootcamp");
const ErrorResponse = require("./../utils/errorResponse");
const asyncHandler = require("./../middleware/async");
const geocoder = require("./../utils/geocoder");

// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
  console.log(req.query);
  let query;

  const reqQuery = {
    ...req.query
  };

  // Fields to exclude
  // Loop over removeFields and delete then from reqQuery
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach(param => delete reqQuery[param]);
  console.log(reqQuery);

  // mongoose advanced filtering
  // create a query string
  // less than, less than equal to, greater than, greater than equal to, in
  let queryStr = JSON.stringify(reqQuery);
  queryStr = JSON.parse(
    queryStr.replace(/\b(gt|gte|lte|lt|in)\b/g, match => `$${match}`)
  );
  // console.log(queryStr);

  // Finding resources
  query = Bootcamp.find(queryStr).populate("courses");

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort: deault sort by createdAt
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  //Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Bootcamp.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Executing query
  const bootcamps = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit: limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit: limit };
  }

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    pagination: pagination,
    data: bootcamps
  });
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

// @desc    Upload photo for butcamp
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
