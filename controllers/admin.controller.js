const Test = require('../models/Test');
const Admin = require('../models/admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Job = require('../models/jobportal.model')

// Create a test
exports.createTest = async (req, res) => {
  try {
    const { title, subject, questions, startTime, duration, createdBy, class: testClass, description, totalMarks, passingMarks, sample_question } = req.body;

    // Save image path if uploaded
    const test_image = req.file ? req.file.path : undefined;

    // Create a new test document with the provided data, including the image path
    const test = new Test({
      title,
      subject,
      questions,
      startTime,
      duration,
      createdBy,
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      test_image, // Store the image path here,
      sample_question,
      
    });

    await test.save();

    // Validate that the user (createdBy) exists before updating
    const admin = await Admin.findById(createdBy);
    if (!admin) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's testsCreated array
    await Admin.findByIdAndUpdate(createdBy, { $push: { testsCreated: test._id } });

    // Send a success response with the created test
    res.status(201).json(test);
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


// Login user
exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || 'bhojsoft';

  try {
    // Find the user by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: admin._id }, JWT_SECRET);

    res.status(200).json({ token ,  message: 'Login successful!'});
  } catch (err) {
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




