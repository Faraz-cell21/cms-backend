const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

// 1. Faculty creates assignment
exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    // Ensure the user is faculty or admin (checked in middleware), 
    // but we also confirm that the user is the actual instructor of the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Optionally check if course.instructor matches req.user._id
    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to create assignment for this course'
      });
    }

    const assignment = await Assignment.create({
      course: courseId,
      faculty: req.user._id,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// 2. Student uploads assignment file to Cloudinary
exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // The file is automatically uploaded to Cloudinary by multer
    // We can access it via req.file
    // e.g. req.file.path -> cloudinary URL

    // 1. Find the assignment
    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // 2. Check if the student is enrolled in the course
    // We can confirm student is in assignment.course.studentsEnrolled
    const isEnrolled = assignment.course.studentsEnrolled.some(
      (entry) => entry.student.toString() === req.user._id.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({
        message: 'You are not enrolled in this course, cannot submit assignment'
      });
    }

    // 3. Add submission
    assignment.submissions.push({
      student: req.user._id,
      fileUrl: req.file ? req.file.path : null, // Cloudinary URL from multer
    });

    await assignment.save();

    res.status(200).json({
      message: 'Assignment submitted successfully',
      assignment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// 3. Optional: faculty can see all submissions
exports.getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId)
      .populate('submissions.student', 'name email') // see who submitted
      .populate('faculty', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // optionally check if req.user._id is the assignment's faculty
    // or if user.role === 'admin'
    // if not, return 403

    res.status(200).json(assignment.submissions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Grading Assignment & giving feedback
exports.gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body; // The data the instructor wants to assign

    // 1. Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // 2. Ensure this assignment belongs to the logged-in instructor
    if (assignment.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }

    // 3. Find the specific submission
    const submissionEntry = assignment.submissions.id(submissionId);
    if (!submissionEntry) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // 4. Update the grade/feedback
    submissionEntry.grade = grade;       // e.g. 'A+', '85', etc.
    submissionEntry.feedback = feedback; // e.g. 'Great job!'

    await assignment.save();

    return res.status(200).json({
      message: 'Assignment graded successfully',
      assignment, // or submission: submissionEntry
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// exports.getMySubmission = async (req, res) => {
//   try {
//     const { assignmentId } = req.params;
//     const assignment = await Assignment.findById(assignmentId);
//     if (!assignment) {
//       return res.status(404).json({ message: 'Assignment not found' });
//     }

//     // Find the student's submission
//     const submissionEntry = assignment.submissions.find(
//       (sub) => sub.student.toString() === req.user._id.toString()
//     );

//     if (!submissionEntry) {
//       return res.status(404).json({ message: 'No submission found for you' });
//     }

//     return res.status(200).json(submissionEntry);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error', error });
//   }
// };

