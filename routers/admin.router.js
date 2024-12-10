const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const {authenticateToken} = require('../middlewares/authMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerConfig');
const { getTest } = require('../controllers/admin.controller');


// Middleware for checking Admin role (this should be expanded in practice)
const isAdmin = async (req, res, next) => {
  // This is a placeholder; you'd typically verify the role from the request or token
  if (req.body.role !== 'admin') {
    return res.status(403).send('Access denied. Only Admins can perform this action.');
  }
  next();
};

// Admin routes
router.post('/test',authenticateToken,upload.single("test_image"), adminController.createTest);
// validation to have only Admin has add
// router.put('/test/:id', isAdmin, AdminController.updateTest);
router.put('/test/:id',authenticateToken, adminController.updateTest);
router.delete('/test/:id',authenticateToken, adminController.deleteTest);
router.get('/tests',authenticateToken, adminController.getTestsByAdmin);
router.get('/:testId',authenticateToken,  adminController.getTestById);

// admin login 
// Admin Registration
router.post('/register', upload.single("admin_image"), adminController.registerAdmin);

router.post('/login', adminController.loginAdmin);

// Create a new job post
router.post('/jobs', authenticateToken, adminController.createJob);

// Route to get top-picked tests
router.get('/top-picked/top-tests1',  adminController.getTopPickedTests);

//Chaceking institue improve or not
router.post('/approve-institute', authenticateToken, adminController.approveInstitute);

router.get('/test/:id', getTest);

module.exports = router;
