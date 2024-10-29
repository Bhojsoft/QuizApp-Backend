const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
<<<<<<< HEAD
const {authenticateToken} = require('../middlewares/authMiddleware');
=======
>>>>>>> a3688c64c4260ca36296affdbc8b6f8557f01106
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
<<<<<<< HEAD
router.post('/test',authenticateToken,upload.single("test_image"), adminController.createTest);
// validation to have only Admin has add
// router.put('/test/:id', isAdmin, AdminController.updateTest);
router.put('/test/:id',authenticateToken, adminController.updateTest);
router.delete('/test/:id',authenticateToken, adminController.deleteTest);
router.get('/tests',authenticateToken, adminController.getTestsByAdmin);
router.get('/:testId',authenticateToken,  adminController.getTestById);
=======
router.post('/test',upload.single("test_image"), adminController.createTest);
// validation to have only Admin has add
// router.put('/test/:id', isAdmin, AdminController.updateTest);
router.put('/test/:id', adminController.updateTest);
router.delete('/test/:id', adminController.deleteTest);
router.get('/tests', adminController.getTestsByAdmin);
router.get('/:testId',  adminController.getTestById);
>>>>>>> a3688c64c4260ca36296affdbc8b6f8557f01106

// admin login 

router.post('/login', adminController.loginAdmin);

module.exports = router;
