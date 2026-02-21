const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStats, getAllUsers, getAllPosts, deletePost } = require('../controllers/adminController');

// Admin middleware - simple role check
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send({ error: 'Access denied. Admins only.' });
    }
    next();
};

router.use(auth, adminAuth);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/posts', getAllPosts);
router.delete('/posts/:postId', deletePost);

module.exports = router;
