const bcrypt = require('bcrypt');
const Teacher = require('../models/teacher_model.js');
const Institute = require('../models/Institute');
const jwt = require('jsonwebtoken');

// Register a teacher
exports.registerTeacher = async (req, res) => {
    try {
      const { name, email, password, instituteId } = req.body;
  
      // Check if the institute exists and is approved
      const institute = await Institute.findOne({ id: instituteId, isApproved: true });
      if (!institute) {
        return res.status(400).json({ message: 'Institute not found or not approved' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new teacher
      const teacher = new Teacher({
        name,
        email,
        password: hashedPassword,
        institute: institute._id,
      });
  
      // Save the teacher
      const savedTeacher = await teacher.save();
  
      // Add the teacher to the institute's list
      institute.teachers.push(savedTeacher._id);
      await institute.save();
  
      // Generate a JWT token
      const token = jwt.sign(
        { userId: savedTeacher._id, email: savedTeacher.email },
        process.env.JWT_SECRET, // Replace with your JWT secret key
        { expiresIn: '1h' } // Token expiration time (e.g., 1 hour)
      );
  
      // Send the response with the token
      res.status(201).json({
        message: 'Teacher registered successfully',
        teacher: savedTeacher,
        token: token, // Return the token
      });
    } catch (error) {
      res.status(500).json({ message: 'Error registering teacher', error: error.message });
    }
  };
  


// Login a teacher
exports.loginTeacher = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the teacher exists
      const teacher = await Teacher.findOne({ email });
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
  
      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, teacher.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Generate a JWT token
      const token = jwt.sign(
        { teacherId: teacher._id, instituteId: teacher.institute },
        process.env.JWT_SECRET,
        { expiresIn: '1d' } // Token expires in 1 day
      );
  
      res.status(200).json({
        message: 'Login successful',
        token,
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          institute: teacher.institute,
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

