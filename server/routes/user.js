const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getProfile, updateProfile, searchUsers, getFollowers, getFollowing, deleteProfile, upload } = require('../controllers/userController');

router.get('/search', searchUsers);
router.get('/:identifier', getProfile);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.patch('/me', auth, upload, updateProfile);
router.delete('/me', auth, deleteProfile);

module.exports = router;
