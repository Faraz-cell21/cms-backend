const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Find courses where this student is enrolled
    // We'll filter courses whose 'studentsEnrolled.student' matches studentId
    const courses = await Course.find({
      'studentsEnrolled.student': studentId,
    });

    let dashboardData = [];

    for (const course of courses) {
      // Check attendance or progress if you track that in the Course model
      const studentEntry = course.studentsEnrolled.find(
        (entry) => entry.student.toString() === studentId.toString()
      );

      // Attendance records, if you have them
      const attendanceRecords = studentEntry && studentEntry.attendance ? studentEntry.attendance : [];

      // 2. Find assignments for this course
      const assignments = await Assignment.find({ course: course._id });

      // For each assignment, check if this student has submitted, any grade
      let assignmentSummary = [];
      for (const assignment of assignments) {
        const submission = assignment.submissions.find(
          (sub) => sub.student.toString() === studentId.toString()
        );

        assignmentSummary.push({
          assignmentId: assignment._id,
          title: assignment.title,
          submitted: Boolean(submission),
          grade: submission ? submission.grade : null,
          feedback: submission ? submission.feedback : null
        });
      }

      dashboardData.push({
        courseId: course._id,
        courseTitle: course.title,
        attendanceRecords,
        assignmentSummary
      });
    }

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

exports.getMySubmission = async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
  
      // Find the student's submission
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