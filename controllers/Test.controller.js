const mongoose = require('mongoose');
const Test = require('../models/Test');
const Admin = require('../models/admin');
const Institute = require('../models/Institute'); // Import the Admin model to check the role
const Question = require('../models/question.model.js');
const Teacher = require('../models/teacher_model.js');
const TestSubmission = require('../models/TestSubmissionmodel.js');


exports.createTest = async (req, res) => {
  try {
    console.log('User role:', req.user.role); // Debug log
    console.log('User ID:', req.user.userId);

    const {
      title,
      subject,
      questions, // Array of question objects
      startTime,
      duration,
      createdBy,
      instituteId,
      description,
      totalMarks,
      passingMarks,
      sample_question,
    } = req.body;

    const test_image = req.file ? req.file.path : undefined;

    // Find the institute by ID
    const institute = await Institute.findById(instituteId);
    let visibility = 'all';
    let visibleTo = [];

    if (institute) {
      visibility = 'institute'; // Restrict visibility to institute
      visibleTo = institute.students || []; // Add students of the institute
    }

    // Save the questions to the database and get their IDs
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

    // Create the test document with question IDs
    const test = new Test({
      title,
      subject,
      questions: questionIds, // Use the saved question IDs
      startTime,
      duration,
      createdBy,
      description,
      totalMarks,
      passingMarks,
      sample_question,
      test_image,
      visibility,
      institute: instituteId,
      visibleTo,
    });

    // Save the test
    const savedTest = await test.save();

    // Populate the questions field with actual question data
    const populatedTest = await Test.findById(savedTest._id).populate({
      path: 'questions', // Specify the path to populate
      select: 'question options correctAnswer', // Specify the fields to include
    });

    // Send a success response with the populated test
    res.status(201).json({
      message: 'Test created successfully',
      test: savedTest,
    });
  } catch (error) {
    console.error('Error creating test:', error); // Log the error
    res.status(400).json({ error: error.message });
  }
};

exports.createTestByTeacher = async (req, res) => {
  try {
      const { title, subject, questions, startTime, duration, description, test_image, totalMarks, passingMarks, visibility } = req.body;

      // Get the teacher's ID and institute from the request (assume req.user is populated by auth middleware)
      const teacherId = req.user.userId;
      const teacher = await Teacher.findById(teacherId);

      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found' });
      }

      // Ensure the teacher's institute is approved
      const institute = await Institute.findById(teacher.institute);
      if (!institute || !institute.isApproved) {
          return res.status(403).json({ message: 'Institute not approved' });
      }

      // Create the test
      const test = new Test({
          title,
          subject,
          questions,
          startTime,
          duration,
          description,
          test_image,
          totalMarks,
          passingMarks,
          visibility,
          createdBy: teacher._id,
          createdByRole: 'Teacher',
          institute: teacher.institute,
      });

      await test.save();

      res.status(201).json({ message: 'Test created successfully', test });
  } catch (error) {
      console.error('Error creating test:', error);
      res.status(500).json({ message: 'Error creating test', error: error.message });
  }
};



// exports.createTest = async (req, res) => {
//   try {
//     console.log('User role:', req.user.role); // Debug log
//     console.log('User ID:', req.user.userId);
//     const { title, subject, questions, startTime, duration } = req.body;
//     const newTest = new Test({
//       title,
//       subject,
//       questions,
//       startTime,
//       duration,
//       // createdBy: req.user.id, // Assuming req.user is set after authentication
//     });
//     await newTest.save();
//     res.status(201).json(newTest);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getTestById = async (req, res) => {
//   try {
//     const test = await Test.findById(req.params.id)
//                             .populate('questions'); // Populate the questions field

//     if (!test) {
//       return res.status(404).json({ error: 'Test not found' });
//     }

//     res.status(200).json(test);
//   } catch (error) {
//     console.error('Error retrieving test:', error);
//     res.status(400).json({ error: error.message });
//   }
// };


async function getTestWithQuestions(testId) {
  try {
    // Find the test by ID and populate the 'questions' field
    const test = await Test.findById(testId).populate('questions');
    console.log('Test with full question data:', test);
    return test;
  } catch (error) {
    console.error('Error retrieving test:', error);
  }
}



// Get all approved tests 
exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find({ isApproved: true }).populate('createdBy');
    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// // Get a Test by ID
// exports.getTestById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // Find the test by ID
//     const test = await Test.findById(id); 

//     if (!test) {
//       return res.status(404).json({ message: 'Test not found' });
//     }

//     res.status(200).json(test);
//   } catch (error) {
//     res.status(500).json({ message: 'Error retrieving test', error });
//   }
// };



// Approve a test admin 
exports.approveTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await Test.findByIdAndUpdate(testId, { isApproved: true }, { new: true });
    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update a Test
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body; 

    // Find the test by ID and update
    const updatedTest = await Test.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedTest) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.status(200).json(updatedTest);
  } catch (error) {
    res.status(500).json({ message: 'Error updating test', error });
  }
};

// Delete a Test
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the test by ID and delete
    const deletedTest = await Test.findByIdAndDelete(id);

    if (!deletedTest) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.status(200).json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting test', error });
  }
};


// Count tests created by an institute
exports.countTestsByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params; // Assume instituteId is passed as a parameter

    // Count tests created by the institute
    const testCount = await Test.countDocuments({ createdBy: instituteId, visibility: "institute" });

    res.status(200).json({ instituteId, testCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Aggregate tests created by an institute
exports.aggregateTestsByInstitute = async (req, res) => {
  try {
    const { instituteId } = req.params;

    const results = await Test.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(instituteId), visibility: "institute" } },
      {
        $group: {
          _id: "$createdBy",
          totalTests: { $count: {} },
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
          "instituteDetails.name": 1, // Include institute name
        },
      },
    ]);

    if (results.length === 0) {
      return res.status(404).json({ error: "No tests found for this institute" });
    }

    res.status(200).json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getTests = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user information from middleware
    const userInstituteId = req.user.institute; // Assuming user's institute is part of the token or session

    // Fetch tests based on visibility
    const tests = await Test.find({
      $or: [
        { visibility: 'all' },
        { visibility: 'institute', institute: userInstituteId },
        { visibility: 'teacher', visibleTo: { $in: [userId] } },
      ],
    }).populate('questions'); // Optionally populate related data

    // Send response
    res.status(200).json({
      message: 'Tests fetched successfully',
      tests,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching tests',
      error: error.message,
    });
  }
};

// submitTest
exports.submitTest = async (req, res) => {
  try {
    const { testId } = req.params; // Extract testId from URL
    const { answers } = req.body; // Extract answers array from request body
    const { userId, role } = req.user; // Extract user details from authentication middleware

    // Ensure the user is a student
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit tests.' });
    }

    // Fetch the test by ID
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      return res.status(404).json({ message: 'Test not found.' });
    }

    const { questions } = test;
    if (answers.length !== questions.length) {
      return res.status(400).json({
        message: 'Number of answers does not match number of questions in the test.',
      });
    }

    // Validate answers and calculate the score
    let correctAnswers = 0;
    const totalQuestions = questions.length;
    const validatedAnswers = questions.map((question, index) => {
      const isCorrect = question.correctAnswer === answers[index];
      if (isCorrect) {
        correctAnswers++;
      }
      return { question: question._id, answer: answers[index] };
    });

    // Calculate score
    const score = (correctAnswers / totalQuestions) * 100;

    // Save the test submission
    const submission = new TestSubmission({
      student: userId,
      test: testId,
      answers: validatedAnswers,
      score,
      totalQuestions,
      correctAnswers,
    });

    await submission.save();

    res.status(201).json({
      message: 'Test submitted successfully.',
      submission: {
        testId,
        totalQuestions,
        correctAnswers,
        score,
      },
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(400).json({ error: error.message });
  }
};

// // Controller function to fetch test details by ID
exports.getTestById = async (req, res) => {
  const { id } = req.params;

  try {
      // Increment the views and return specific fields.
      const test = await Test.findByIdAndUpdate(
          id,
          { $inc: { views: 1 } }, // Increment the views field.
          { new: true, select: 'title testId test_image' } // Select only specific fields.
      );

      if (!test) {
          return res.status(404).json({ error: "Test not found" });
      }

      // Customize the response data.
      const response = {
          title: test.title,
          image: test.test_image || 'assets/images/Photo UI.png', // Default image fallback.
          testId: test._id, // Use the `_id` field for `testId`.
      };

      // Send the customized test data as a response.
      res.json(response);
  } catch (error) {
      console.error(`Error fetching test details for ID ${id}:`, error);
      res.status(500).json({ error: "Error fetching test details" });
  }
};


// Top picks test 



