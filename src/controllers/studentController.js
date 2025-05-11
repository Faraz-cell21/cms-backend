const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require("../models/User");


exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    const student = await User.findById(studentId).select("course session semester");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const courses = await Course.find({ "studentsEnrolled.student": studentId });

    let dashboardData = [];

    for (const course of courses) {
      const studentEntry = course.studentsEnrolled.find(
        (entry) => entry.student.toString() === studentId.toString()
      );

      const attendanceRecords = studentEntry && studentEntry.attendance ? studentEntry.attendance : [];

      const assignments = await Assignment.find({ course: course._id });

      let assignmentSummary = assignments.map((assignment) => {
        const submission = assignment.submissions.find(
          (sub) => sub.student.toString() === studentId.toString()
        );

        return {
          assignmentId: assignment._id,
          title: assignment.title,
          submitted: Boolean(submission),
          grade: submission ? submission.grade : null,
          feedback: submission ? submission.feedback : null,
        };
      });

      dashboardData.push({
        courseId: course._id,
        courseTitle: course.title,
        creditHours: course.creditHours || "N/A",
        attendanceRecords,
        assignmentSummary,
      });
    }

    return res.status(200).json({
      studentDetails: {
        name: req.user.name,
        email: req.user.email,
        course: student.course,
        session: student.session,
        semester: student.semester,
      },
      dashboardData,
    });
  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getMySubmission = async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      const submissionEntry = assignment.submissions.find(
        (sub) => sub.student.toString() === req.user._id.toString()
      );
  
      if (!submissionEntry) {
        return res.status(404).json({ message: 'No submission found for you' });
      }
  
      return res.status(200).json(submissionEntry);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  };

  exports.getStudentAttendance = async (req, res) => {
    try {
      const { courseId } = req.params;
      const studentId = req.user._id;
  
      const course = await Course.findById(courseId).populate("studentsEnrolled.student", "name email");
  
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      const studentEntry = course.studentsEnrolled.find(
        (entry) => entry.student._id.toString() === studentId.toString()
      );
  
      if (!studentEntry) {
        return res.status(404).json({ message: "You are not enrolled in this course" });
      }
  
      return res.status(200).json({
        student: {
          _id: studentEntry.student._id,
          name: studentEntry.student.name,
          email: studentEntry.student.email,
        },
        attendance: studentEntry.attendance,
      });
    } catch (error) {
      console.error("Get Student Attendance Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  exports.getStudentProgress = async (req, res) => {
    try {
        const studentId = req.user._id;

        const completedAssignments = await Assignment.countDocuments({
            "submissions.student": studentId,
            "submissions.grade": { $exists: true }
        });

        const totalAssignments = await Assignment.countDocuments({});

        const attendanceRecords = await Course.find({
            "studentsEnrolled.student": studentId
        }).select("studentsEnrolled");

        let totalAttendance = 0;
        let attendedDays = 0;

        attendanceRecords.forEach(course => {
            course.studentsEnrolled.forEach(enrollment => {
                if (enrollment.student && enrollment.student.toString() === studentId.toString()) {
                    attendedDays += enrollment.attendance
                        ? enrollment.attendance.filter(a => a.status === "present").length
                        : 0;
                    totalAttendance += enrollment.attendance ? enrollment.attendance.length : 0;
                }
            });
        });

        const assignmentProgress = totalAssignments ? (completedAssignments / totalAssignments) * 100 : 0;
        const attendanceProgress = totalAttendance ? (attendedDays / totalAttendance) * 100 : 0;

        const overallProgress = ((assignmentProgress + attendanceProgress) / 2).toFixed(2);

        res.status(200).json({ weeklyProgress: overallProgress });
    } catch (error) {
        console.error("Error fetching student progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const Announcement = require("../models/Announcement");

exports.getStudentAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find().sort({ createdAt: -1 });
        res.status(200).json(announcements);
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ message: "Server error" });
    }
};
