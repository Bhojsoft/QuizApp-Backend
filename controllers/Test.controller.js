const Test = require('../models/Test');

// Create a new test
exports.createTest = async (req, res) => {
  try {
    const { title, subject, questions, startTime, duration } = req.body;
    const newTest = new Test({
      title,
      subject,
      questions,
      startTime,
      duration,
      // createdBy: req.user.id, // Assuming req.user is set after authentication
    });
    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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


