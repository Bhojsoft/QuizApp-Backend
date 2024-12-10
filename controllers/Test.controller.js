const mongoose = require('mongoose');
const Test = require('../models/Test');
const Admin = require('../models/admin');
const Institute = require('../models/Institute'); // Import the Admin model to check the role
const Question = require('../models/question.model.js');


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

exports.getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
                            .populate('questions'); // Populate the questions field

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.status(200).json(test);
  } catch (error) {
    console.error('Error retrieving test:', error);
    res.status(400).json({ error: error.message });
  }
};


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


// Get a Test by ID
exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the test by ID
    const test = await Test.findById(id); 

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving test', error });
  }
};



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




// Top picks test 



