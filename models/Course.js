const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add title for the course"]
  },
  description: {
    type: String,
    required: [true, "Please add a description"]
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"]
  },
  tuition: {
    type: Number,
    required: [true, "Please add a Tuition cost"]
  },
  minimumSkill: {
    type: String,
    enum: ["beginner", "intermediate", "advanced"],
    required: [true, "Please add a minimum skill"]
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  bootcamp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bootcamp",
    required: true
  }
});

// we want the average cost of the bootcamp to be calculated automatically:
// that means we want functions to run when a course is added and also when a course is deleted
// static method to get average of course tuitions
CourseSchema.statics.getAverageCost = async function(bootcampId) {
  console.log("Calculating average cost".blue, bootcampId);
  // console.log(this);
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" }
      }
    }
  ]);

  console.log(obj);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10
    });
  } catch (err) {
    console.error(err);
  }
};

// Call getAverageCost after save
CourseSchema.post("save", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

// Call getAverageCost before remove
CourseSchema.pre("remove", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
