const bcrypt = require('bcrypt');
const Teacher = require('../models/teacher_model.js');
const Institute = require('../models/Institute');
const jwt = require('jsonwebtoken');
const Test = require('../models/Test');
const mongoose = require('mongoose');
const Question = require('../models/question.model');


// Register a teacher  
exports.registerTeacher = async (req, res) => {
  try {
    const { name, email, password, instituteId, role } = req.body;

    let institute;

    if (mongoose.isValidObjectId(instituteId)) {
      institute = await Institute.findOne({
        _id: new mongoose.Types.ObjectId(instituteId),
        isApproved: true,
      });
    } else {
      institute = await Institute.findOne({
        id: instituteId,
        isApproved: true,
      });
    }

    if (!institute) {
      return res.status(400).json({ message: 'Institute not found or not approved' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new Teacher({
      name,
      email,
      password: hashedPassword,
      institute: institute._id,
      role,
      isApproved: false, // Default to false during registration
    });

    const savedTeacher = await teacher.save();

    institute.teachers.push(savedTeacher._id);
    await institute.save();

    const token = jwt.sign(
      { userId: savedTeacher._id, email: savedTeacher.email, role: savedTeacher.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Teacher registered successfully',
      teacher: {
        id: savedTeacher._id,
        name: savedTeacher.name,
        email: savedTeacher.email,
        isApproved: savedTeacher.isApproved,
        institute: savedTeacher.institute,
        role: savedTeacher.role,
      },
      token,
    });
  } catch (error) {
    console.error("Error registering teacher:", error.message);
    res.status(500).json({ message: 'Error registering teacher', error: error.message });
  }
};



// Login a teacher
exports.loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the teacher exists
    const teacher = await Teacher.findOne({ email }).populate('institute');
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    // Verify the associated institute is approved
    if (!teacher.institute || !teacher.institute.isApproved) {
      return res.status(403).json({
        message: 'Institute not approved. Please contact your administrator.',
      });
    }

    // Verify the teacher's approval status
    if (!teacher.isApproved) {
      return res.status(403).json({
        message: 'Teacher account not approved. Please contact your institute.',
      });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        teacherId: teacher._id,
        instituteId: teacher.institute._id,
        role: teacher.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      teacher: {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        isApproved: teacher.isApproved,
        institute: teacher.institute._id,
        role: teacher.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error: error.message });
  }
};



  //Institue of teacher
  exports.getTeachersByInstitute = async (req, res) => { 
    try {
        const { instituteId } = req.params;

        // Ensure we use the correct field for querying (e.g., _id)
        const institute = await Institute.findOne({ _id: instituteId }).populate('teachers');

        if (!institute) {
            return res.status(404).json({ message: 'Institute not found' });
        }

        // Check if the institute is approved if necessary
        if (!institute.approved) {
            return res.status(403).json({ message: 'Institute not approved' });
        }

        res.status(200).json({ teachers: institute.teachers });
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
};

//create test by teacher
exports.createTest = async (req, res) => {
  try {
    const {
      title,
      subject,
      questions,
      startTime,
      duration,
      createdBy, // ID of the teacher
      class: testClass,
      description,
      totalMarks,
      passingMarks,
      sample_question,
    } = req.body;

    const { teacherId, role } = req.user; // Use `userId` and `role` from `req.user` set by the auth middleware
    console.log('User role:', role);
    console.log('Checking teacher with userId:', teacherId); // Debugging output

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: 'Invalid user ID format.' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      console.log('Teacher not found for userId:', teacherId); // Debugging output
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    // Log the teacher object to ensure it exists and is valid
    console.log('Teacher object:', teacher);

    // Validate the provided createdBy ID matches the logged-in teacher's ID
    if (createdBy.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized: You cannot create a test for another teacher.' });
    }

    // Set default visibility and associate with the teacher
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

    // Create a new test and associate it with the teacher
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
      visibility: 'institute', // Ensure institute visibility
      institute: teacher.institute._id, // Restrict to the teacher
      teacher: teacherId, // Associate the test with the logged-in teacher
    });

    // Save the test and update the teacher's testsCreated array
    await test.save();

    // Debug: Log teacher's testsCreated array before pushing
    console.log('Teacher testsCreated before push:', teacher.testsCreated);

    if (!teacher.testsCreated) {
      teacher.testsCreated = []; // Ensure testsCreated is an array if it was not initialized
    }
    teacher.testsCreated.push(test._id);

    // Save the updated teacher document
    await teacher.save();

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


