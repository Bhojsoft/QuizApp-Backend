const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Institute = require('../models/Institute');
const Admin = require('../models/admin');
//const Student = require('../models/student');
const { v4: uuidv4 } = require('uuid');



const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Register a new institute
// Register a new institute
exports.createInstitute = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new Institute instance
    const newInstitute = new Institute({
      name,
      email,
      password: hashedPassword,
      isApproved: false, // Default value
    });

    // Save the new institute to the database
    await newInstitute.save();

    // Generate a token for the newly created institute
    const token = jwt.sign(
      { id: newInstitute._id, role: 'institute' },
      JWT_SECRET,
      { expiresIn: '1h' } // Token expiration time
    );

    // Send response with the token and institute details
    res.status(201).json({
      message: 'Institute created successfully. Awaiting approval.',
      token, // Include the generated token in the response
      institute: {
        id: newInstitute.id,
        name: newInstitute.name,
        email: newInstitute.email,
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
    const token = jwt.sign({ id: institute._id, role: 'institute' }, JWT_SECRET, { expiresIn: '1h' });

    // Send response with token and institute details, including custom ID
    res.status(200).json({
      message: 'Login successful!',
      token,
      institute: {
        id: institute.id, // Return the custom UUID field
        name: institute.name,
        email: institute.email,
        isApproved: institute.isApproved,
      }
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ error: error.message });
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
