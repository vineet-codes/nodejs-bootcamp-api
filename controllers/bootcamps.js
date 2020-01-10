// @desc    Get all bootcamps
// @route   GET /api/v1/bootcamps
// @access  public
exports.getBootcamps = (req, res, next) => {
  res.status(200).json({ sucess: true, message: "Show all bootcamps" });
};

// @desc    Get a bootcamp
// @route   GET /api/v1/bootcamps/:id
// @access  public
exports.getBootcamp = (req, res, next) => {
  res
    .status(200)
    .json({ sucess: true, message: `Get bootcamp ${req.params.id}` });
};

// @desc    create a new bootcamp
// @route   POST /api/v1/bootcamps/
// @access  private
exports.createBootcamp = (req, res, next) => {
  res.status(200).json({ sucess: true, message: "create new bootcamp" });
};

// @desc    update a bootcamp
// @route   PUT /api/v1/bootcamps/:id
// @access  private
exports.updateBootcamp = (req, res, next) => {
  res
    .status(200)
    .json({ sucess: true, message: `Update bootcamp ${req.params.id}` });
};

// @desc    delete a bootcamp
// @route   DELETE /api/v1/bootcamps/:id
// @access  private
exports.deleteBootcamp = (req, res, next) => {
  res
    .status(200)
    .json({ sucess: true, message: `delete bootcamp ${req.params.id}` });
};
