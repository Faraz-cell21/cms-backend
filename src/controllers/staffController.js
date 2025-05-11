const Course = require('../models/Course');  // Import the Course model
const Assignment = require('../models/Assignment');

// Staff Dashboard
exports.getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // ✅ Fetch courses with populated student details & attendance records
    const courses = await Course.find({ instructor: instructorId }).populate(
      "studentsEnrolled.student",
      "name email course session semester"
    );

    let dashboardData = [];

    for (const course of courses) {
      const enrolledCount = course.studentsEnrolled.length;

      // ✅ Get Attendance Records for Each Student
      const attendanceRecords = course.studentsEnrolled
  .filter(entry => entry.student) // ✅ Filter out null students
  .map((studentEntry) => ({
    studentId: studentEntry.student._id,
    name: studentEntry.student.name,
    email: studentEntry.student.email,
    course: studentEntry.student.course,
    session: studentEntry.student.session,
    semester: studentEntry.student.semester,
    attendance: studentEntry.attendance,
  }));


      // ✅ Fetch Assignments for the Course
      const assignments = await Assignment.find({
        course: course._id,
        faculty: instructorId,
      });

      let assignmentSummary = assignments.map((assignment) => {
        const totalSubmissions = assignment.submissions.length;
        const gradedSubmissions = assignment.submissions.filter((sub) => sub.grade).length;
        return {
          assignmentId: assignment._id,
          title: assignment.title,
          totalSubmissions,
          gradedSubmissions,
          ungradedSubmissions: totalSubmissions - gradedSubmissions,
        };
      });

      // ✅ Push Course Data to Dashboard Response
      dashboardData.push({
        courseId: course._id,
        courseTitle: course.title,
        startDate: course.startDate,
        creditHours: course.creditHours, // ✅ Include Credit Hours
        enrolledCount,
        attendanceRecords,
        assignmentSummary,
      });
    }

    return res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error in getInstructorDashboard:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

exports.getEnrolledStudents = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course and populate student details
    const course = await Course.findById(courseId).populate("studentsEnrolled.student", "name email");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Extract the student data
    const enrolledStudents = course.studentsEnrolled.filter(entry => entry.student).map((entry) => ({
      studentId: entry.student._id,
      name: entry.student.name,
      email: entry.student.email,
    }));

    res.status(200).json({ courseTitle: course.title, enrolledStudents });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getCourseDetails = async (req, res) => {
  try {
      const { courseId } = req.params;

      const course = await Course.findById(courseId)
          .populate("instructor", "name email")
          .populate("studentsEnrolled.student", "name email")
          .populate({
              path: "assignments", // ✅ Now it works
              select: "title dueDate submissions",
              populate: {
                  path: "submissions.student",
                  select: "name email"
              }
          });

      if (!course) {
          return res.status(404).json({ message: "Course not found" });
      }

      res.status(200).json(course);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Mark Attendance
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { date, status } = req.body; // e.g. { date: '2025-02-10', status: 'present' }

    if (!["present", "absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const studentEntry = course.studentsEnrolled.find(
      (entry) => entry.student.toString() === studentId
    );
    if (!studentEntry) {
      return res.status(404).json({ message: "Student not enrolled in this course" });
    }

    // ✅ Check if attendance for this date exists
    const existingAttendance = studentEntry.attendance.find(
      (record) => record.date.toDateString() === new Date(date).toDateString()
    );

    if (existingAttendance) {
      existingAttendance.status = status;
    } else {
      studentEntry.attendance.push({ date: new Date(date), status });
    }

    await course.save();

    res.status(200).json({ message: "Attendance marked successfully", course });
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Attendance
exports.getAttendance = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    console.log("Fetching attendance for course:", courseId, "Student:", studentId || "ALL");

    const course = await Course.findById(courseId).populate(
      "studentsEnrolled.student",
      "name email"
    );

    if (!course) {
      console.error("Course not found:", courseId);
      return res.status(404).json({ message: "Course not found" });
    }

    if (studentId) {
      const studentEntry = course.studentsEnrolled.find(
        (entry) => entry.student._id.toString() === studentId
      );

      if (!studentEntry) {
        console.error("Student not found in course:", studentId);
        return res.status(404).json({ message: "Student not enrolled in this course" });
      }

      return res.status(200).json({
        student: {
          _id: studentEntry.student._id,
          name: studentEntry.student.name,
          email: studentEntry.student.email,
        },
        attendance: studentEntry.attendance,
      });
    }

    return res.status(200).json(course.studentsEnrolled);
  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSubmittedAssignments = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // Find assignments related to the staff member
    const assignments = await Assignment.find({ faculty: instructorId })
      .populate("course", "title")
      .populate("submissions.student", "name email");

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({ message: "No submitted assignments found." });
    }

    // Format response
    const response = assignments.map((assignment) => ({
      assignmentId: assignment._id,
      title: assignment.title,
      courseTitle: assignment.course.title,
      submissions: assignment.submissions.map((sub) => ({
        studentName: sub.student.name,
        studentEmail: sub.student.email,
        fileUrl: sub.fileUrl,
        submittedAt: sub.createdAt,
      })),
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching submitted assignments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findById(assignmentId)
      .populate("submissions.student", "name email")
      .exec();

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.status(200).json(assignment.submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Server error" });
  }
};


