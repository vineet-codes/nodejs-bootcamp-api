const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxlength: 100
  },
  text: {
    type: String,
    required: [true, "Please add some text"]
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add a rating between 1 and 10"]
  },
  createAt: {
    type: Date,
    default: Date.now
  },
  bootcamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bootcamp",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

// Prevent user from submitting more than 1 review per bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// we want the average rating of the bootcamp to be calculated automatically:
// that means we want functions to run when a review is added and also when a review is deleted
// static method to get average ratings and save
ReviewSchema.statics.getAverageRating = async function(bootcampId) {
  console.log("Calculating average rating".blue, bootcampId);
  // console.log(this);
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" }
      }
    }
  ]);

  console.log(obj);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageRating after save
ReviewSchema.post("save", function() {
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function() {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
