const PracticeTest = require('../models/practicetest'); // Assuming the schema is in 'models/practiceTest.js'

// Create a new practice test
exports.createPracticeTest = async (req, res) => {
    try {
        const { title, subject, topic, questions, startTime, duration, description, totalMarks, passingMarks } = req.body;

        const adminId = req.user.userId; // Assuming admin is authenticated and their id is stored in req.user

        const newPracticeTest = new PracticeTest({
            title,
            subject,
            topic,
            questions,
            startTime,
            duration,
            createdBy: adminId,
            totalMarks,
            passingMarks
        });

        const savedTest = await newPracticeTest.save();

        res.status(201).json({
            success: true,
            message: 'Practice test created successfully',
            data: savedTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating practice test',
            error: error.message
        });
    }
};

// Get all practice tests
exports.getAllPracticeTests = async (req, res) => {
    try {
        const practiceTests = await PracticeTest.find().populate('createdBy', 'name email'); // Populating admin data (optional)
        res.status(200).json({
            success: true,
            data: practiceTests
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching practice tests',
            error: error.message
        });
    }
};

// Get a single practice test by ID
exports.getPracticeTestById = async (req, res) => {
    try {
        const practiceTest = await PracticeTest.findById(req.params.id).populate('createdBy', 'name email');

        if (!practiceTest) {
            return res.status(404).json({
                success: false,
                message: 'Practice test not found'
            });
        }

        res.status(200).json({
            success: true,
            data: practiceTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching practice test',
            error: error.message
        });
    }
};

// Update a practice test
exports.updatePracticeTest = async (req, res) => {
    try {
        const { title, subject, topic, questions, startTime, duration, description, test_image, totalMarks, passingMarks } = req.body;

        const updatedTest = await PracticeTest.findByIdAndUpdate(
            req.params.id, 
            { title, subject, topic, questions, startTime, duration, description,  totalMarks, passingMarks },
            { new: true, runValidators: true } // new: true returns the updated document
        );

        if (!updatedTest) {
            return res.status(404).json({
                success: false,
                message: 'Practice test not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Practice test updated successfully',
            data: updatedTest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating practice test',
            error: error.message
        });
    }
};

// Delete a practice test
exports.deletePracticeTest = async (req, res) => {
    try {
        const deletedTest = await PracticeTest.findByIdAndDelete(req.params.id);

        if (!deletedTest) {
            return res.status(404).json({
                success: false,
                message: 'Practice test not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Practice test deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting practice test',
            error: error.message
        });
    }
};
