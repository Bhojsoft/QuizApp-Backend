const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Test = require('../models/Test');
const userModel = require('../models/user.model');
const { default: mongoose } = require('mongoose');
const PracticeTest = require('../models/practicetest');
const notificationModel = require('../models/notification.model');



// Controller to get  tests by subject and retrieve test_image
exports.getTestCountBySubject = async (req, res) => {
    try {
        // MongoDB aggregation to group by subject, count tests, and get test_image
        const testCounts = await Test.aggregate([
            {
                $group: {
                    _id: "$subject", // Group by subject
                    test_image: { $first: "$test_image" } // Get the first test_image for each subject group
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    subject: "$_id", // Include the subject field
                    test_image: 1 // Include the test_image field
                }
            }
        ]);

        // If no tests found
        if (testCounts.length === 0) {
            return res.status(404).json({ message: 'No tests found' });
        }

        // Return the grouped test count data with subject and test_image
        res.status(200).json({
            message: 'Test count by subject retrieved successfully',
            data: testCounts,
        });
    } catch (error) {
        console.error('Error retrieving test count:', error);
        res.status(500).json({ message: 'Error retrieving test count', error });
    }
};

// Controller to get topics and quizzes by subject name
exports.getTopicsAndQuizzesBySubject = async (req, res) => {
    try {
        const { subject } = req.params;  // Get the subject from the URL params

        // MongoDB aggregation pipeline to match subject, group by topic, and retrieve quizzes
        const topicsWithQuizzes = await Test.aggregate([
            {
                $match: { subject: subject } // Match the subject
            },
            {
                $group: {
                    _id: "$topic", // Group by topic
                    quizzes: {
                        $push: {
                            subject: "$subject",         // Quiz title
                            test_image: "$test_image" // Quiz image
                        }
                    },
                    quizCount: { $sum: 1 } // Count quizzes per topic
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the default _id field
                    topic: "$_id", // Topic name
                    quizzes: 1, // Include the list of quizzes
                    quizCount: 1 // Include the count of quizzes
                }
            }
        ]);

        // If no topics or quizzes found for the subject
        if (topicsWithQuizzes.length === 0) {
            return res.status(404).json({ message: 'No topics or quizzes found for the specified subject' });
        }

        // Return the topics and their quizzes
        res.status(200).json({
            message: 'Topics and quizzes retrieved successfully',
            data: topicsWithQuizzes,
        });
    } catch (error) {
        console.error('Error retrieving topics and quizzes:', error);
        res.status(500).json({ message: 'Error retrieving topics and quizzes', error });
    }
};

// Get a specific test details
exports.getTest = async (req, res) => {
    try {
        const baseUrl = req.protocol + "://" + req.get("host");
        const testId = req.params.id;
        const test = await Test.findById(testId).populate("createdBy", "name admin_image");

        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        // Send the test without answers to prevent cheating
        const sanitizedTest = {
            title: test.title,
            subject: test.subject,
            class: test.class,
            description: test.description,
            createdBy: test.createdBy.name,
            admin_image: test.createdBy.admin_image,
            sample_question: test.sample_question,
            test_image: test?.test_image
                ? `${baseUrl}/${test?.test_image?.replace(/\\/g, "/")}`
                : "",
        };

        res.status(200).json(sanitizedTest);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch test data' });
    }
};


// Get a specific test Quiz
exports.getTestQuiz = async (req, res) => {
    try {
        const testId = req.params.id;
        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        // Send the test without answers to prevent cheating
        const sanitizedTest = {
            questions: test.questions
        };

        res.status(200).json(sanitizedTest);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch test data' });
    }
};


// submit the test

exports.submitTest = async (req, res) => {
    try {
        const baseUrl = req.protocol + "://" + req.get("host");
        const testId = req.params.id;
        const { answers } = req.body;
        const userId = req.user.userId;

        // Validate test existence
        const test = await Test.findById(testId);

        if (!test) {
            return res.status(404).json({ error: 'Test not found' });
        }

        // Validate input data
        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ error: 'Answers must be provided as an array.' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'user ID is required.' });
        }

        let score = 0;
        const totalQuestions = test.questions.length;

        // Evaluate answers
        test.questions.forEach((question, index) => {
            const userAnswer = answers[index];
            const correctAnswer = question.correctAnswer?.trim().toLowerCase();

            if (userAnswer && userAnswer.trim().toLowerCase() === correctAnswer) {
                score += 1;
            }
        });

        const finalScore = parseFloat(((score / totalQuestions) * 100).toFixed(2));


        // Update student's test history
        const user = await userModel.findByIdAndUpdate(
            userId,
            { $push: { testsTaken: { testId, score: finalScore } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'user not found' });
        }

        // Create notification
        const notification = new notificationModel({
            recipient: user._id,
            message: `Hello ${user.name}, your test on the subject "${test.subject}" has been submitted successfully!`,
            activityType: "TEST_SUBMIT",
            relatedId: user._id,
        });

        await notification.save();

        // Send the final score and result
        res.status(200).json({
            message: 'Test submitted successfully',
            score: finalScore,
            userName: user.name,
            totalQuestions,
            profile_image: user?.profile_image
                ? `${baseUrl}/${user?.profile_image?.replace(/\\/g, "/")}`
                : "",
            correctAnswers: score,
            wrongAnswers: totalQuestions - score
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to submit test answers' });
    }
};



// Get Practice Test by Subject Name
exports.getPracticeTestsBySubject = async (req, res) => {
    const { subject } = req.params;

    try {
        const tests = await PracticeTest.find({ subject }); // Query the database for practice tests with the given subject

        if (tests.length === 0) {
            return res.status(404).json({ message: 'No practice tests found for the given subject.' });
        }



        res.status(200).json(tests); // Send the found tests in the response
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while fetching practice tests.', error });
    }
};


// Calculate and Display Practice Test Score
exports.calculatePracticeTestScore = async (req, res) => {
    const { testId } = req.params; // Retrieve the test ID from the URL parameters
    const { userAnswers } = req.body; // Get the user's answers from the request body

    try {
        // Find the practice test by ID
        const practiceTest = await PracticeTest.findById(testId);

        if (!practiceTest) {
            return res.status(404).json({ message: 'Practice test not found.' });
        }

        let score = 0;
        let totalMarks = 0;

        // Loop through the questions and calculate the score
        practiceTest.questions.forEach((question, index) => {
            totalMarks += 1; // Assuming each question carries 1 mark
            if (userAnswers[index] === question.correctAnswer) {
                score += 1;
            }
        });

        // Prepare the result data
        const result = {
            testTitle: practiceTest.title,
            totalQuestions: practiceTest.questions.length,
            score: score,
            totalMarks: totalMarks,
            percentage: (score / totalMarks) * 100,
            passingMarks: practiceTest.passingMarks,
            passed: score >= practiceTest.passingMarks,
        };

        // Send the result in the response
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'An error occurred while calculating the score.', error });
    }
};





// JWT secret (store this in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'bhojsoft';
// Register a new user
exports.registerUser = async (req, res) => {
    const { name, email, password, phone } = req.body;

    try {
        // Check if the email is already in use
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Create a new user
        user = new User({ name, email, password, phone });
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);



        res.status(201).json({ token, message: 'Register successful!' });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user', error: err.message });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        const notification = new notificationModel({
            recipient: user._id,
            message: `Welcome back ${user.name} , Login successful.`,
            activityType: "LOGIN_SUCCESS",
            relatedId: user._id,
        });
        await notification.save();

        res.status(200).json({ token, message: 'Login successful!' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
    }
};


// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId); // Assuming req.user is set by the auth middleware

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,

        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Controller to update user details
exports.updateUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find the user by ID to fetch current data
        const existingUser = await User.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract updated data from request body and profile image from the request
        const updateData = req.body;
        const profile_image = req.file ? req.file.path : existingUser.profile_image; // Retain current image if not updated

        // Check if password is being updated and hash it if provided
        if (updateData.password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt); // Hash the new password
        }

        // Merge existing data with updated data; keep existing fields if not provided
        const data = {
            ...existingUser.toObject(), // Spread current user data
            ...updateData,              // Overwrite with new data
            profile_image               // Ensure the profile image is updated correctly
        };

        // Find the user by ID and update the document
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: data }, // Update the merged data
            { new: true, runValidators: true } // Return the updated document and run validation
        );

        // Generate JWT token
        const token = jwt.sign({ userId: updatedUser._id }, JWT_SECRET);
        const notification = new notificationModel({
            recipient: updatedUser._id,
            message: `Hello ${updatedUser.name}, Your Profile updated successfully :).`,
            activityType: "PROFILE_UPDATED",
            relatedId: updatedUser._id,
        });
        await notification.save();


        res.status(200).json({
            message: 'User updated successfully',
            token, // Send the new token
            user: updatedUser // Send updated user info
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating user', error });
    }
};





// Controller to retrieve user and populate testsTaken with test details submited the test only
exports.getUserWithTests = async (req, res) => {
    try {
        const baseUrl = req.protocol + "://" + req.get("host");
        const { userId } = req.params;  // Extract userId from URL params

        // Check if userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Find the user by ID and populate only _id, title, and test_image from the 'Test' schema
        const user = await User.findById(userId)
            .select("_id")
            .populate({
                path: 'testsTaken.testId',
                select: '_id subject test_image',  // Select only id, title (for name), and test_image
                // model: Test,  // Make sure to reference the Test model explicitly
            });


        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const result = {
            testsTaken: user.testsTaken.map(test => {
                return {
                    _id: test?.testId?._id,
                    subject: test?.testId?.subject,
                    test_image: test?.testId?.test_image ? `${baseUrl}/${test?.testId?.test_image.replace(/\\/g, "/")}`
                        : ""
                }
            }
            ),
        }
        res.status(200).json(result);
    } catch (error) {
        console.error('Error retrieving user and tests:', error);
        res.status(500).json({ message: 'Error retrieving user', error });
    }
};



// Controller to get all tests with specific fields
exports.getAllTests = async (req, res) => {
    try {

        // Define the base URL for constructing the test_image URL
        const baseUrl = req.protocol + '://' + req.get('host');

        // Fetch only specific fields from the tests
        const tests = await Test.find(); // Select only _id, subject, and test_image

        // Map through the results to format the test_image field
        const formattedTests = tests.map(test => ({
            _id: test._id,
            subject: test.subject,
            test_image: test.test_image
                ? `${baseUrl}/${test.test_image.replace(/\\/g, "/")}`
                : ""
        }));

        // Send the formatted tests as a response
        res.status(200).json({
            success: true,
            count: formattedTests.length,
            data: formattedTests
        });
    } catch (error) {
        // Send error response if something goes wrong
        console.log(error);

        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};



// Controller to filter users by average test scores
exports.getTopUsersByAverageScore = async (req, res) => {
    try {
        // Find all users and calculate the average test score from testsTaken
        const users = await User.aggregate([
            // Unwind the testsTaken array to work with individual test records
            { $unwind: "$testsTaken" },
            // Group by user ID to calculate the average score for each user
            {
                $group: {
                    _id: "$_id",
                    name: { $first: "$name" },
                    email: { $first: "$email" },
                    profile_image: { $first: "$profile_image" },
                    averageScore: { $avg: "$testsTaken.score" } // Calculate the average score
                }
            },
            // Sort users by their average score in descending order
            { $sort: { averageScore: -1 } }
        ]);

        // Send the result back as a response
        res.status(200).json({
            success: true,
            message: 'Users filtered by average test score',
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error. Unable to retrieve users.',
            error: error.message
        });
    }
};

// Calculate the percentage of tests completed by the user
exports.getTestCompletionPercentage = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Find the user by ID
        const user = await User.findById(userId).populate('testsTaken.testId');

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch the total number of tests assigned (assuming Test model contains all tests assigned)
        const totalTests = await Test.countDocuments();

        if (totalTests === 0) return res.status(200).json({ message: 'No tests assigned yet', completionPercentage: 0 });

        // Calculate the percentage of completed tests
        const testsTakenCount = user.testsTaken.length;
        const completionPercentage = (testsTakenCount / totalTests) * 100;

        res.status(200).json({
            message: 'Test completion percentage calculated successfully',
            completionPercentage: completionPercentage.toFixed(2) // Format to 2 decimal places
        });
    } catch (error) {
        res.status(500).json({ message: 'Could not calculate test completion percentage', error });
    }
};





