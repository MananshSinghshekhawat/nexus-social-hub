const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');

const toggleLike = async (req, res) => {
    try {
        const existingLike = await Like.findOne({ user: req.user._id, post: req.params.postId });
        if (existingLike) {
            await Like.deleteOne({ _id: existingLike._id });
            await Post.findByIdAndUpdate(req.params.postId, { $inc: { likes_count: -1 } });
            res.send({ liked: false });
        } else {
            const like = new Like({ user: req.user._id, post: req.params.postId });
            await like.save();
            const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { likes_count: 1 } });

            // Create notification
            if (post.user.toString() !== req.user._id.toString()) {
                const notification = new Notification({
                    user: post.user,
                    actor: req.user._id,
                    type: 'like',
                    post: post._id
                });
                await notification.save();
            }
            res.status(201).send({ liked: true });
        }
    } catch (error) {
        res.status(400).send(error);
    }
};

const addComment = async (req, res) => {
    try {
        const comment = new Comment({
            ...req.body,
            user: req.user._id,
            post: req.params.postId
        });
        await comment.save();
        const post = await Post.findByIdAndUpdate(req.params.postId, { $inc: { comments_count: 1 } });

        // Create notification
        if (post.user.toString() !== req.user._id.toString()) {
            const notification = new Notification({
                user: post.user,
                actor: req.user._id,
                type: 'comment',
                post: post._id
            });
            await notification.save();
        }
        res.status(201).send(comment);
    } catch (error) {
        res.status(400).send(error);
    }
};

const toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.userId;
        if (targetUserId === req.user._id.toString()) {
            return res.status(400).send({ error: "You can't follow yourself" });
        }

        const existingFollow = await Follow.findOne({ follower: req.user._id, following: targetUserId });
        if (existingFollow) {
            await Follow.deleteOne({ _id: existingFollow._id });
            res.send({ following: false });
        } else {
            const follow = new Follow({ follower: req.user._id, following: targetUserId });
            await follow.save();

            // Create notification
            const notification = new Notification({
                user: targetUserId,
                actor: req.user._id,
                type: 'follow'
            });
            await notification.save();
            res.status(201).send({ following: true });
        }
    } catch (error) {
        res.status(400).send(error);
    }
};

const getComments = async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('user', 'username display_name avatar_url')
            .sort({ created_at: 1 });
        res.send(comments);
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { toggleLike, addComment, toggleFollow, getComments };

