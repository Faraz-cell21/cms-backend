const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Announcement = require("../models/Announcement");
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');

exports.createUserAsAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, role, course, session, semester } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const allowedRoles = ['admin', 'staff', 'student'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email' });
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role,
        course: role === "student" ? course : undefined,
        session: role === "student" ? session : undefined,
        semester: role === "student" ? semester : undefined,
    });

    if (newUser) {
        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            createdAt: newUser.createdAt,
        });
    } else {
        res.status(500).json({ message: 'User creation failed' });
    }
});

exports.createCourse = async (req, res) => {
  try {
    const { title, description, instructor, startDate, creditHours } = req.body;

    if (!title || !description || !instructor || !startDate || !creditHours) {
      return res.status(400).json({ message: "Missing required fields: title, description, or startDate" });
    }

    const parsedCreditHours = Number(creditHours);
    if (![3, 4].includes(parsedCreditHours)) {
      return res.status(400).json({ message: "Credit Hours must be 3 or 4." });
    }

    const course = await Course.create({
      title,
      description,
      instructor: instructor || null,
      startDate,
      creditHours: parsedCreditHours,
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, instructor } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (instructor) course.instructor = instructor;

    await course.save();

    res.status(200).json({
      message: "Course updated successfully",
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('instructor', 'name email');
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findByIdAndDelete(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.enrollStudent = async (req, res) => {
    try {
      const { courseId, studentId } = req.params;
      const course = await Course.findById(courseId);
  
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
  
      const alreadyEnrolled = course.studentsEnrolled.some(
        (enrollment) => enrollment.student.toString() === studentId
      );
      if (alreadyEnrolled) {
        return res.status(400).json({ message: 'Student already enrolled' });
      }
  
      course.studentsEnrolled.push({ student: studentId });
      await course.save();
  
      res.status(200).json({
        message: 'Student enrolled successfully',
        course,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  };
  
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalAdmins = await User.countDocuments({ role: 'admin' }); 
    const totalCourses = await Course.countDocuments();
    const totalAssignments = await Assignment.countDocuments();

    return res.status(200).json({
      totalUsers,
      totalStudents,
      totalStaff,
      totalAdmins,
      totalCourses,
      totalAssignments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

exports.getInstructors = async (req, res) => {
  try {
    const instructors = await User.find({ role: "staff" }).select("_id name email");
    res.status(200).json(instructors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('_id name email course session semester');
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}

exports.createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, dueDate } = req.body;

  if (!title || !content || !dueDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const announcement = await Announcement.create({
    title,
    content,
    dueDate,
  });

  res.status(201).json({ message: "Announcement created successfully!", announcement });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const { name, newPassword } = req.body;
  const { studentId } = req.params;

  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
  }

  // Update name
  if (name) student.name = name;

  // Update password only if newPassword is provided
  if (newPassword) student.password = newPassword; 

  await student.save();
  res.json({ message: 'Student updated successfully!' });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await User.findById(studentId);
  if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
  }

  await User.findByIdAndDelete(studentId);
  res.json({ message: 'Student deleted successfully!' });
});

exports.updateStaff = asyncHandler(async (req, res) => {
  const { name, newPassword } = req.body;
  const { staffId } = req.params;

  const staff = await User.findById(staffId);
  if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
  }

  // Update name
  if (name) staff.name = name;

  // Update password only if newPassword is provided
  if (newPassword) staff.password = newPassword;

  await staff.save();
  res.json({ message: 'Staff updated successfully!' });
});

exports.deleteStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const staff = await User.findById(staffId);
  if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found' });
  }

  await User.findByIdAndDelete(staffId);
  res.json({ message: 'Staff deleted successfully!' });
});

exports.getAllAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ dueDate: 1 });
  res.json(announcements);
});

exports.deleteAnnouncement = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    return res.status(404).json({ message: "Announcement not found" });
  }

  await Announcement.findByIdAndDelete(announcementId);
  res.json({ message: "Announcement deleted successfully!" });
});