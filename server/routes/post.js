const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createPost, getPosts, getPostById, deletePost, upload } = require('../controllers/postController');

router.post('/', auth, upload, createPost);
router.get('/', getPosts);

router.get('/:id', getPostById);
router.delete('/:id', auth, deletePost);

module.exports = router;
