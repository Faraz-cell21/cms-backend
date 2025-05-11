const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createUserAsAdmin ,createCourse, updateCourse, getAllCourses, deleteCourse, enrollStudent, getAdminDashboard, getInstructors, getStudents, createAnnouncement, updateStudent, deleteStudent, updateStaff, deleteStaff, deleteAnnouncement, getAllAnnouncements } = require('../controllers/adminController');
const { getAllAssignments } = require('../controllers/assignmentController');

// POST /api/admin/create-user
router.post('/create-user', protect, authorize('admin'), createUserAsAdmin);

// Admin can create course
router.post('/courses', protect, authorize('admin'), createCourse);

// Admin can update course
router.put('/courses/:courseId', protect, authorize('admin'), updateCourse);

// Admin can get all courses (optional)
router.get('/courses', protect, authorize('admin'), getAllCourses);

// Admin can delete a course
router.delete('/courses/:courseId', protect, authorize('admin'), deleteCourse);

// Admin or Staff can enroll a student
router.put('/courses/:courseId/enroll/:studentId', protect, authorize('admin', 'staff'), enrollStudent);

// Dashboard
router.get('/dashboard', protect, authorize('admin'), getAdminDashboard);

// Get all instructors (staff members)
router.get('/instructors', protect, authorize('admin'), getInstructors);

router.get('/students', protect, authorize('admin'), getStudents)  

router.get('/assignments', protect, authorize('admin'), getAllAssignments);

// Route for creating announcements (Admin only)
router.post("/announcements", protect, authorize("admin"), createAnnouncement);

router.get("/announcements", protect, authorize("admin"), getAllAnnouncements);

// Delete an announcement
router.delete("/announcements/:announcementId", protect, authorize("admin"), deleteAnnouncement);

// Add this route to allow admin to update a student's name & password
router.put('/students/:studentId', protect, authorize('admin'), updateStudent);

// Delete a student
router.delete('/students/:studentId', protect, authorize('admin'), deleteStudent);

// Edit staff (update name & password)
router.put('/staff/:staffId', protect, authorize('admin'), updateStaff);

// Delete staff
router.delete('/staff/:staffId', protect, authorize('admin'), deleteStaff);


module.exports = router;
