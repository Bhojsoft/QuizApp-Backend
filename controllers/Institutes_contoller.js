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



// Create a test
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
    const questionIds = [];
    for (const question of questions) {
      const savedQuestion = await new Question({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
      }).save();
      questionIds.push(savedQuestion._id);
    }

    // Create a new test
    const test = new Test({
      title,
      subject,
      questions: questionIds, // Use saved question IDs
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

    // Populate the questions to return the full data
    const populatedTest = await Test.findById(test._id).populate('questions');

    res.status(201).json({
      message: 'Test created successfully',
      test: populatedTest, // Return populated test with full question data
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

    // Check if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({ error: "Invalid institute ID format" });
    }

    // Use mongoose.Types.ObjectId correctly
    const objectId = new mongoose.Types.ObjectId(instituteId);

    // Log for debugging
    console.log('Received instituteId:', instituteId);

    const results = await Test.aggregate([
      {
        $match: {
          createdBy: objectId, // Use the correctly created ObjectId here
          visibility: "institute"
        }
      },
      {
        $lookup: {
          from: "institutes",
          localField: "createdBy",
          foreignField: "_id",
          as: "instituteDetails"
        }
      },
      {
        $unwind: {
          path: "$instituteDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0, // Exclude the default _id field
          title: 1, // Include the title of the test
          subject: 1, // Include the subject of the test
          questions: 1, // Include the questions field (if needed)
          createdBy: 1, // Include the ID of the creator (optional)
          instituteName: "$instituteDetails.name", // Include the name of the institute
          // Add any other fields you need to include in the response
        }
      }
    ]);

    // Log the aggregation result for debugging
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



