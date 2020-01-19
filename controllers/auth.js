const crypto = require("crypto");
const User = require("./../models/User");
const ErrorResponse = require("./../utils/errorResponse");
const asyncHandler = require("./../middleware/async");
const sendEmail = require("./../utils/sendEmail");

// @desc    Register User
// @route   POST /api/v1/auth/register
// @access  public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name: name,
    email: email,
    password: password,
    role: role
  });

  sendTokeResponse(user, 200, res);
});

// @desc    Login
// @route   GET /api/v1/auth/login
// @access  public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validating and password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email: email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid Creds", 401));
  }

  // check password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid Creds", 401));
  }

  sendTokeResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await await User.findById(req.user.id);

  res.status(200).json({ success: true, data: user });
});

// @desc    Update logged in user's password
// @route   PUT /api/v1/auth/updatepassword
// @access  private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  // check current passwors
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse(`Password is incorrect`, 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokeResponse(user, 200, res);
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  });

  res.status(200).json({ success: true, data: user });
});

// @desc    Forgot Password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  // check if user exists with the email that was provided in the body
  if (!user) {
    return next(
      new ErrorResponse(`There is no user with email: ${req.body.email}`, 404)
    );
  }

  // Get reset Token
  const resetToken = user.getResetPasswordToken();

  // update db with the reset token and time: they are being update in the user model method
  await user.save({ validateBeforeSave: false });

  // send and email with a link when user can update password

  // create reset url
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You are recieving this email because you or someone else has requested the reset of the password. 
                    Please make a PUT request to ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message
    });
    res.status(200).json({ success: true, data: "Email sent" });
  } catch (error) {
    console.log(error);

    // if we cannot send email, update token and expiry token to undefined
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse(`Email could not be sent`, 500));
  }
});

// @desc    Reset password
// @route   GET /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resettoken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse("Invalid Token", 400));
  }

  // set new password
  user.password = req.body.password; // it will get hased auutomatically because of pre save method on user

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokeResponse(user, 200, res);
});

// Get token from model, alos create cookie and send response
const sendTokeResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV == "production") {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token: token });
};
