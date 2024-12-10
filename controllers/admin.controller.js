const Test = require('../models/Test');
const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Job = require('../models/jobportal.model');
const Institute = require('../models/Institute');
const Question = require('../models/question.model');

// Create a test
exports.createTest = async (req, res) => {
  try {
    const {
      title,
      subject,
      questions, // Expect an array of question objects
      startTime,
      duration,
      createdBy,
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      sample_question,
      visibility,
    } = req.body;

    const test_image = req.file ? req.file.path : undefined;

    // Save the questions to the database if they are not already saved
    const questionIds = [];
    for (const questionData of questions) {
      const question = new Question({
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
      });

      const savedQuestion = await question.save();
      questionIds.push(savedQuestion._id);
    }

    // Create the test with references to the saved questions
    const test = new Test({
      title,
      subject,
      questions: questionIds, // Store question IDs
      startTime,
      duration,
      createdBy,
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      test_image,
      sample_question,
      visibility,
    });

    const savedTest = await test.save();

    // Validate that the user (createdBy) exists
    const admin = await Admin.findById(createdBy);
    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's testsCreated array
    await Admin.findByIdAndUpdate(createdBy, { $push: { testsCreated: savedTest._id } });

    // Populate the questions field to include actual data
    const populatedTest = await Test.findById(savedTest._id).populate('questions');

    // Send a success response with the populated test
    res.status(201).json({
      message: "Test created successfully",
      test: populatedTest,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Update a test
exports.updateTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const updateData = req.body;
    const test = await Test.findByIdAndUpdate(testId, updateData, { new: true });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Delete a test
exports.deleteTest = async (req, res) => {
  try {
    const testId = req.params.id;
    const test = await Test.findByIdAndDelete(testId);

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    await Admin.findByIdAndUpdate(test.createdBy, { $pull: { testsCreated: testId } });

    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all tests created by the Admin

exports.getTestsByAdmin = async (req, res) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const tests = await Test.find({ createdBy: req.user.userId });

    // Map through the tests and update the test_image field
    const updatedTests = tests.map(test => {
      return {
        ...test._doc, // Spread to preserve other properties
        test_image: `${baseUrl}${test.test_image}` // Concatenate base URL with test_image
      };
    });

    res.status(200).json(updatedTests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Get test by ID
exports.getTestById = async (req, res) => {
  try {
    const baseUrl = req.protocol + "://" + req.get("host");
    const { testId } = req.params;

    // Find the test by its ID
    const test = await Test.findById(testId).populate('createdBy', 'name email'); // Populate Admin info

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const result={
      title:test.title,
      subject:test.subject,
      questions:test.questions,
      startTime:test.startTime,
      duration:test.duration,
      createdBy:test.createdBy,
      class:test.class,
      description:test.description,
      totalMarks:test.totalMarks,
      passingMarks:test.passingMarks,
      test_image:test?.test_image
      ? `${baseUrl}/${test?.test_image?.replace(/\\/g, "/")}`
      : "", // Store the image path here,
      sample_question:test.sample_question
    }

    res.status(200).json(
    result
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.registerAdmin = async (req, res) => {
  const { name, email, password, role, admin_image } = req.body;

  try {
    // Check if admin with the same email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this email already exists.' });
    }

    // Create a new admin
    const newAdmin = new Admin({
      name,
      email,
      password,
      role, // Optional; will default to 'sub-admin' if not provided
      admin_image,
    });

    // Save the new admin to the database
    const savedAdmin = await newAdmin.save();
    res.status(201).json({ 
      message: 'Admin registered successfully!', 
      admin: { 
        id: savedAdmin._id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role
      } 
    });
  } catch (err) {
    res.status(500).json({ message: 'Error registering admin.', error: err.message });
  }
};






// Login user
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || 'bhojsoft';

  try {
    // Find the user by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token with an expiration time of 1 hour
    const generateToken = (user) => {
      return jwt.sign(
        { userId: user._id, role: user.role }, // Ensure `user.role` is correctly set (e.g., 'main-admin' or 'sub-admin')
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    };

    // Generate the token for the logged-in admin
    const token = generateToken(admin);

    // Optionally include admin details (excluding sensitive information)
    const adminData = {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    // Send the response with the token and user details
    res.status(200).json({
      token, // Include the generated token here
      admin: adminData,
      message: 'Login successful!',
    });
  } catch (err) {
    console.error('Error logging in:', err); // Log the error for debugging
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
};


exports.createJob = async (req, res) => {
  try {
      console.log("Creating job with data:", req.body);
      const job = new Job({
          ...req.body,
          createdBy: req.user._id,
      });
      console.log("Job initialized:", job);

      const savedJob = await job.save();
      res.status(201).json(savedJob);
  } catch (error) {
      console.error("Error occurred while saving job:", error);
      res.status(400).json({ error: error.message });
  }
};


// Controller to get top-picked tests
exports.getTopPickedTests = async (req, res) => {
  try {
      // Find the top tests sorted by views in descending order, limit to top 10
      const topTests = await Test.find()
      .select("-questions")
          .sort({ views: -1 }) // Sort by views in descending order
          .limit(10);
      res.status(200).json({
          success: true,
          message: 'Top picked tests retrieved successfully.',
          data: topTests,
      });
  } catch (error) {
      res.status(500).json({
      
          success: false,
          message: 'An error occurred while fetching top tests.',
          error: error.message,
      });
  }
};




exports.approveInstitute = async (req, res) => {
  try {
      const { instituteId } = req.body;
      console.log(req.user); // Log user details for debugging

      if (req.user.role !== 'main-admin') {
          return res.status(403).json({ message: 'Permission denied' });
      }

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

// Fetch the test and populate the questions field
exports.getTest = async (req, res) => {
  try {
    const testId = req.params.id; // Assuming the test ID is passed as a parameter

    // Find the test by ID and populate the 'questions' field
    const test = await Test.findById(testId).populate('questions');

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
