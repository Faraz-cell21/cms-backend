const Course = require('../models/Course');  // Import the Course model
const Assignment = require('../models/Assignment');

exports.markAttendance = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { date, status } = req.body; // e.g. { date: '2025-02-10', status: 'present' }

    // Validate status
    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the enrolled student object
    const studentEntry = course.studentsEnrolled.find(
      (entry) => entry.student.toString() === studentId
    );
    if (!studentEntry) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }

    // Check if attendance for this date already exists
    const existingAttendance = studentEntry.attendance.find(
      (record) => record.date.toDateString() === new Date(date).toDateString()
    );

    if (existingAttendance) {
      // Update the existing attendance record
      existingAttendance.status = status;
    } else {
      // Push a new attendance record
      studentEntry.attendance.push({
        date: new Date(date),
        status,
      });
    }

    await course.save();

    res.status(200).json({
      message: 'Attendance marked successfully',
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAttendance = async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
  
      // Fetch the course and populate the student objects for easier reading
      const course = await Course.findById(courseId)
        .populate('studentsEnrolled.student', 'name email');
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      // If a specific student ID is provided, return just their attendance
      if (studentId) {
        const studentEntry = course.studentsEnrolled.find(
          (entry) => entry.student && entry.student._id.toString() === studentId
        );
  
        if (!studentEntry) {
          return res.status(404).json({ message: 'Student not enrolled in this course' });
        }
  
        return res.status(200).json({
          student: {
            _id: studentEntry.student._id,
            name: studentEntry.student.name,
            email: studentEntry.student.email,
          },
          attendance: studentEntry.attendance, // array of { date, status }
        });
      }
  
      // Otherwise, return attendance for all enrolled students
      res.status(200).json(course.studentsEnrolled);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// Staff Dashboard
  exports.getInstructorDashboard = async (req, res) => {
    try {
      // The logged-in instructor's ID
      const instructorId = req.user._id;
  
      // 1. Find all courses taught by this instructor
      const courses = await Course.find({ instructor: instructorId }).populate('studentsEnrolled.student', 'name email');
  
      // 2. Build summary data
      // For each course, count how many studentsEnrolled
      // Also find assignments that belong to this course & instructor
      let dashboardData = [];
  
      for (const course of courses) {
        // Count enrolled students
        const enrolledCount = course.studentsEnrolled.length;
  
        // Find assignments for this course (with this instructor as well)
        const assignments = await Assignment.find({ course: course._id, faculty: instructorId });
        
        // If you want to count how many submissions are ungraded, do something like:
        let assignmentSummary = [];
        for (const assignment of assignments) {
          const totalSubmissions = assignment.submissions.length;
          const gradedSubmissions = assignment.submissions.filter(sub => sub.grade).length;
          const ungradedSubmissions = totalSubmissions - gradedSubmissions;
  
          assignmentSummary.push({
            assignmentId: assignment._id,
            title: assignment.title,
            totalSubmissions,
            gradedSubmissions,
            ungradedSubmissions
          });
        }
  
        dashboardData.push({
          courseId: course._id,
          courseTitle: course.title,
          enrolledCount,
          assignmentSummary
        });
      }
  
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error', error });
    }
  };