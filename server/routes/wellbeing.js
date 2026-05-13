const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getUserWellbeingData,
  updateWellbeingSettings,
  getAllUsersWellbeingData,
  getUserWellbeingDataAdmin
} = require('../controllers/wellbeingController');

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).send({ error: 'Access denied. Admins only.' });
  }
  next();
};

// User routes
router.get('/me', auth, getUserWellbeingData);
router.patch('/me/settings', auth, updateWellbeingSettings);

// Admin routes
router.get('/admin/all', auth, adminAuth, getAllUsersWellbeingData);
router.get('/admin/user/:userId', auth, adminAuth, getUserWellbeingDataAdmin);

module.exports = router;
