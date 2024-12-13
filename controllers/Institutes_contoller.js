const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');
const Admin = require('../models/admin');
//const Student = require('../models/student');
const { v4: uuidv4 } = require('uuid');
const Test = require('../models/Test');
const User = require('../models/user.model.js');
const mongoose = require('mongoose');
const Question = require('../models/question.model');
const TestSubmission = require('../models/TestSubmissionmodel.js');
const Teacher = require('../models/teacher_model.js');



const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Register a new institute
exports.createInstitute = async (req, res) => {
  try {
    const { name, email, password, role = 'sub-admin' } = req.body;

    // Debugging log for the password
    console.log('Password before hashing:', password);

    // Check for missing fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Institute instance
    const newInstitute = new Institute({
      name,
      email,
      password: hashedPassword,
      isApproved: false,
      role,
    });

    // Save the new institute to the database
    await newInstitute.save();

    // Generate a token for the newly created institute
    const token = jwt.sign(
      { id: newInstitute._id, role: newInstitute.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Institute created successfully. Awaiting approval.',
      token,
      institute: {
        id: newInstitute.id,
        name: newInstitute.name,
        email: newInstitute.email,
        role: newInstitute.role,
        isApproved: newInstitute.isApproved,
      },
    });
  } catch (error) {
    console.error('Error creating institute:', error.message);
    res.status(400).json({ error: error.message });
  }
};



// Login for institutes
exports.loginInstitute = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the institute by email
    const institute = await Institute.findOne({ email });
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, institute.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token
    const token = jwt.sign({ id: institute._id, role: 'institute' }, JWT_SECRET, { expiresIn: '30d' });

    // Send response with token and institute details, including custom ID
    res.status(200).json({
      message: 'Login successful!',
      token,
      institute: {
        id: institute.id, // Return the custom UUID field
        name: institute.name,
        email: institute.email,
        isApproved: institute.isApproved,
        role: institute.role,
      }
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: error.message });
  }
};




// Create a test associated with an institute
exports.createTest = async (req, res) => {
  try {
    const {
      title,
      subject,
      questions,
      startTime,
      duration,
      createdBy, // ID of the institute
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      sample_question,
    } = req.body;

    // Ensure creator exists and is an institute
    const institute = await Institute.findById(createdBy);
    if (!institute) {
      return res.status(404).json({ error: 'Creator not found (Institute).' });
    }

    // Set default visibility
    const visibility = 'institute';

    // Save the questions to the database
    const savedQuestions = [];
    for (const question of questions) {
      const savedQuestion = await new Question({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
      }).save();
      savedQuestions.push(savedQuestion); // Store the complete question objects
    }

    // Create a new test
    const test = new Test({
      title,
      subject,
      questions: savedQuestions.map((q) => q._id), // Use saved question IDs
      startTime,
      duration,
      createdBy,
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      sample_question,
      visibility, // Restrict to the institute
      institute: institute._id, // Associate the test with the institute
    });

    // Save the test and update the institute's testsCreated array
    await test.save();

    // Update the institute with the test ID
    institute.testsCreated.push(test._id);
    await institute.save();

    // Respond with the test and full question data
    res.status(201).json({
      message: 'Test created successfully',
      test: {
        ...test.toObject(), // Convert the test document to a plain object
        questions: savedQuestions, // Include the full question data
      },
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(400).json({ error: error.message });
  }
};


// Add a teacher to an institute
exports.addTeacherToInstitute = async (req, res) => {
  try {
    const { instituteId, teacherId } = req.body;
    const institute = await Institute.findByIdAndUpdate(instituteId, { $push: { teachers: teacherId } }, { new: true });
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    res.status(200).json({ message: 'Teacher added successfully', institute });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Add a student to an institute
exports.addStudentToInstitute = async (req, res) => {
  try {
    const { instituteId, studentId } = req.body;
    const institute = await Institute.findByIdAndUpdate(instituteId, { $push: { students: studentId } }, { new: true });
    if (!institute) {
      return res.status(404).json({ error: 'Institute not found' });
    }
    res.status(200).json({ message: 'Student added successfully', institute });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Get tests for students in a specific institute
exports.getTestsForInstitute = async (req, res) => {
  try {
    const instituteId = req.params.instituteId;
    const institute = await Institute.findById(instituteId).populate('teachers');
    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const tests = await Test.find({ createdBy: { $in: institute.teachers.map((teacher) => teacher._id) } });
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Approve an institute
exports.approveInstitute = async (req, res) => {
  try {
    const { instituteId } = req.body;

    // Check if the user is a main admin
    if (req.user.role !== 'main-admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Update the institute's approval status
    const institute = await Institute.findByIdAndUpdate(
      instituteId,
      { isApproved: true },
      { new: true }
    );

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    res.status(200).json({ message: 'Institute approved successfully', institute });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get alll institute create test count
exports.countTestsForAllInstitutes = async (req, res) => {
  try {
    const results = await Test.aggregate([
      { $match: { visibility: "institute" } }, // No filtering by createdBy here
      {
        $group: {
          _id: "$createdBy",
          totalTests: { $sum: 1 }, // Use $sum to count documents
        },
      },
      {
        $lookup: {
          from: "institutes", // Collection name of the Institute model
          localField: "_id",
          foreignField: "_id",
          as: "instituteDetails",
        },
      },
      { $unwind: "$instituteDetails" },
      {
        $project: {
          _id: 0,
          totalTests: 1,
          "instituteDetails.name": 1,
        },
      },
    ]);

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Get all student that institute
exports.getStudentsByInstitute = async (req, res) => {
  try {
    const instituteId = req.params.instituteId;
    const students = await User.find({ instituteId: instituteId }).populate('instituteId');

    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this institute.' });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// Aggregate tests created by an institute

exports.aggregateTestsByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({ error: "Invalid institute ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(instituteId);

    console.log('Received instituteId:', instituteId);

    const results = await Test.aggregate([
      {
        $match: {
          createdBy: objectId,
          visibility: "institute",
        },
      },
      {
        $lookup: {
          from: "institutes",
          localField: "createdBy",
          foreignField: "_id",
          as: "instituteDetails",
        },
      },
      {
        $lookup: {
          from: "questions", // Assuming your question collection is named "questions"
          localField: "questions",
          foreignField: "_id",
          as: "questionDetails",
        },
      },
      {
        $unwind: {
          path: "$instituteDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          title: 1,
          subject: 1,
          questions: "$questionDetails", // Replace question IDs with full question details
          createdBy: 1,
          instituteName: "$instituteDetails.name",
        },
      },
    ]);

    console.log('Aggregation results:', results);

    if (results.length === 0) {
      return res.status(404).json({ error: "No tests found for this institute" });
    }

    res.status(200).json(results);
  } catch (error) {
    console.error('Error in aggregateTestsByInstitute:', error);
    res.status(500).json({ error: error.message });
  }
};

//Institute approve teacher 
 
exports.approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;

    // Log user details for debugging
    console.log(req.user);

    // Verify that the user has the correct role (changed from 'institute-admin' to 'institute')
    if (req.user.role !== 'institute') {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Find the teacher by ID
    const teacher = await Teacher.findById(teacherId).populate('institute');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Check if the teacher's institute matches the admin's institute
    if (!teacher.institute || !teacher.institute.equals(req.user.instituteId)) {
      return res.status(403).json({ message: 'Permission denied. You cannot approve this teacher.' });
    }

    // Approve the teacher
    teacher.isApproved = true;
    await teacher.save();

    res.status(200).json({ message: 'Teacher approved successfully', teacher });
  } catch (error) {
    console.error(error);  // Log the error for debugging purposes
    res.status(500).json({ error: error.message });
  }
};


const authenticateToken = async (req, res, next) => {
  try {
    // Get the token from the authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ message: 'Access denied: No authorization header provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Access denied: No token provided' });
    }

    // Decode the token using your verifyToken function (assuming it returns a valid decoded object)
    const decoded = await verifyToken(token);

    // Check the user's role and assign appropriate user data to req.user
    if (decoded.role === 'institute') {
      const institute = await Institute.findById(decoded.id);
      if (!institute) {
        return res.status(401).json({ message: 'Access denied: Invalid token' });
      }
      // Attach both institute's ID and role for users with an institute role
      req.user = { userId: institute._id, role: decoded.role, instituteId: institute._id };
    } else if (['main-admin', 'sub-admin'].includes(decoded.role)) {
      const admin = await Admin.findById(decoded.userId);
      if (!admin) {
        return res.status(401).json({ message: 'Access denied: Invalid token' });
      }
      req.user = { userId: admin._id, role: decoded.role };
    } else if (decoded.role === 'teacher') {
      const teacher = await Teacher.findById(decoded.id);
      if (!teacher) {
        return res.status(401).json({ message: 'Access denied: Invalid token' });
      }
      req.user = { userId: teacher._id, role: decoded.role };
    } else if (decoded.role === 'institute-admin') {
      // If the role is 'institute-admin', find the associated institute for the admin
      const instituteAdmin = await Institute.findById(decoded.id);
      if (!instituteAdmin) {
        return res.status(401).json({ message: 'Access denied: Invalid token' });
      }
      req.user = { userId: instituteAdmin._id, role: decoded.role, instituteId: instituteAdmin._id };
    } else {
      // Role doesn't match expected ones, deny access
      return res.status(403).json({ message: 'Forbidden: Invalid role' });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



