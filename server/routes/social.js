const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { toggleLike, addComment, toggleFollow, getComments } = require('../controllers/socialController');

router.post('/like/:postId', auth, toggleLike);
router.post('/comment/:postId', auth, addComment);
router.post('/follow/:userId', auth, toggleFollow);
router.get('/comments/:postId', getComments);

module.exports = router;
