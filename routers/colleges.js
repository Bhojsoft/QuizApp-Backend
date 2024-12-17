const express = require('express');
const router = express.Router();
const College = require('../models/College_model');

// API route to fetch all colleges
router.get('/api/colleges', async (req, res) => {
    try {
        const colleges = await College.find({}, { _id: 1, name: 1 }); // Only fetch ID and Name
        const response = colleges.map(college => ({
            id: college._id.toString(),
            name: college.name,
        }));
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while fetching colleges.' });
    }
});

module.exports = router;
