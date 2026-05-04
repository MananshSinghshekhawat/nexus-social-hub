const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const getStats = async (req, res) => {
    try {
        const [totalUsers, totalPosts, totalComments] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments()
        ]);
        res.send({ totalUsers, totalPosts, totalComments });
    } catch (error) {
        res.status(500).send(error);
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ created_at: -1 });
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'username display_name avatar_url')
            .sort({ created_at: -1 })
            .limit(100);
        res.send(posts);
    } catch (error) {
        res.status(500).send(error);
    }
};

const deletePost = async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.postId);
        res.send({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Ensure the admin isn't deleting themselves
        if (userId === req.user._id.toString()) {
            return res.status(400).send({ error: 'Cannot delete yourself.' });
        }

        await User.findByIdAndDelete(userId);
        await Post.deleteMany({ user: userId });
        await Comment.deleteMany({ user: userId });

        res.send({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { getStats, getAllUsers, getAllPosts, deletePost, deleteUser };
