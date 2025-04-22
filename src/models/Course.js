const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Instructor reference
  startDate: { type: Date, required: true },
  creditHours: { type: Number, required: true, enum: [3, 4] },
  studentsEnrolled: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      attendance: [
        {
          date: { type: Date },
          status: { type: String, enum: ["present", "absent"] },
        },
      ],
    },
  ],
  assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Assignment" }],
}, { timestamps: true });

module.exports = mongoose.model("Course", CourseSchema);
