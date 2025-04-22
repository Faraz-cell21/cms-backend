const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getInstructorDashboard, getEnrolledStudents, markAttendance, getAttendance, getCourseDetails, getSubmittedAssignments, getSubmissions } = require('../controllers/staffController');
const { gradeAssignment } = require('../controllers/assignmentController');

router.put(
    '/assignments/:assignmentId/grade/:submissionId',
    protect,
    authorize('staff'), // or admin if you want admin to grade too
    gradeAssignment
);

router.get(
    '/dashboard',
    protect,
    authorize('staff'),  // Only instructors allowed
    getInstructorDashboard
  );

router.get(
    "/:courseId/students",
    protect,
    authorize("staff", "admin"), // ✅ Only Staff or Admin can see enrolled students
    getEnrolledStudents
  );

  router.get(
    "/course/:courseId",
    protect,
    authorize("staff", "admin"),
    getCourseDetails
);

// ✅ Mark attendance for a student in a course
router.put(
  "/courses/:courseId/attendance/:studentId",
  protect,
  authorize("staff"),
  markAttendance
);

// ✅ Get attendance records (all students or a specific student)
router.get(
  "/courses/:courseId/attendance/:studentId?",
  protect,
  authorize("staff"),
  getAttendance
);

router.get(
  "/submitted-assignments", 
  protect, 
  authorize("staff"), 
  getSubmittedAssignments
);

router.get(
  "/assignments/:assignmentId/submissions",
  protect,
  authorize("staff"),
  getSubmissions
);


module.exports = router;
