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
        const users = await User.find().select('username display_name avatar_url bio created_at').sort({ created_at: -1 });
        res.send(users);
    } catch (error) {
        res.status(500).send(error);
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'username display_name')
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

module.exports = { getStats, getAllUsers, getAllPosts, deletePost };
