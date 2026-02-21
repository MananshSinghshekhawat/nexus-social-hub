const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]);

const createPost = async (req, res) => {
    try {
        const { content, post_type } = req.body;
        let image_url = null;
        let video_url = null;

        if (req.files) {
            if (req.files.image) {
                image_url = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.video) {
                video_url = `/uploads/${req.files.video[0].filename}`;
            }
        }

        const post = new Post({
            user: req.user._id,
            content,
            post_type,
            image_url,
            video_url,
            audio_name: req.body.audio_name || '',
            filter: req.body.filter || 'none'
        });

        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
};

const getPosts = async (req, res) => {
    try {
        const { userId, type } = req.query;
        const query = {};
        if (userId) query.user = userId;
        if (type) {
            query.post_type = type;
        } else {
            // Exclude stories from main feed
            query.post_type = { $ne: 'story' };
        }

        const posts = await Post.find(query)
            .populate('user', 'username display_name avatar_url')
            .sort({ created_at: -1 })
            .limit(50);
        res.send(posts);
    } catch (error) {
        console.error('Error in getPosts:', error);
        res.status(500).send({ error: error.message });
    }
};

const getPostById = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('user', 'username display_name avatar_url');
        if (!post) {
            return res.status(404).send();
        }
        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!post) {
            return res.status(404).send();
        }
        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { createPost, getPosts, getPostById, deletePost, upload };
