const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const {authenticateToken} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerConfig');
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

router.post('/login', adminController.loginAdmin);

module.exports = router;
