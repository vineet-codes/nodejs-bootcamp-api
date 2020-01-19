const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add a name"]
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please add a valid email"]
  },
  role: {
    type: String,
    enum: ["user", "publisher"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createAt: {
    type: Date,
    default: Date.Now
  }
});

// Encrypt password using bcrypt
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// match user entered password and has in db
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// generate and has reset password token
UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString("hex");

  // hash token and set to resetPasswordToken
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
