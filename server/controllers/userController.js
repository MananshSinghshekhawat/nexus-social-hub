const User = require('../models/User');
const Follow = require('../models/Follow');
const multer = require('multer');
const path = require('path');

// Multer setup for profile uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `profile-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).fields([{ name: 'avatar', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);

const getProfile = async (req, res) => {
    try {
        const identifier = req.params.identifier;
        console.log(`Fetching profile for identifier: ${identifier}`);

        let query = { username: identifier };

        // If identifier is a valid ObjectId, allow searching by _id too
        if (identifier && identifier.match(/^[0-9a-fA-F]{24}$/)) {
            query = { $or: [{ username: identifier }, { _id: identifier }] };
        }

        const user = await User.findOne(query).select('-password');

        if (!user) {
            console.log(`User not found for identifier: ${identifier}`);
            return res.status(404).send({ error: 'User not found' });
        }
        res.send(user);
    } catch (error) {
        console.error('Error in getProfile:', error);
        res.status(500).send({ error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['display_name', 'bio', 'website'];

        updates.forEach((update) => {
            if (allowedUpdates.includes(update)) {
                req.user[update] = req.body[update];
            }
        });

        if (req.files) {
            if (req.files.avatar) {
                req.user.avatar_url = `/uploads/${req.files.avatar[0].filename}`;
            }
            if (req.files.cover) {
                req.user.cover_url = `/uploads/${req.files.cover[0].filename}`;
            }
        }

        await req.user.save();
        res.send(req.user);
    } catch (error) {
        console.error('Error in updateProfile:', error);
        res.status(400).send({ error: error.message });
    }
};

const searchUsers = async (req, res) => {
    try {
        const query = req.query.q;
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { display_name: { $regex: query, $options: 'i' } }
            ]
        }).select('username display_name avatar_url bio').limit(10);
        res.send(users);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

const getFollowers = async (req, res) => {
    try {
        const follows = await Follow.find({ following: req.params.userId }).populate('follower', 'username display_name avatar_url bio');
        const followers = follows.map(f => f.follower);
        res.send(followers);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

const getFollowing = async (req, res) => {
    try {
        const follows = await Follow.find({ follower: req.params.userId }).populate('following', 'username display_name avatar_url bio');
        const following = follows.map(f => f.following);
        res.send(following);
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
};

const deleteProfile = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);
        res.send({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error in deleteProfile:', error);
        res.status(500).send({ error: error.message });
    }
};

module.exports = { getProfile, updateProfile, searchUsers, getFollowers, getFollowing, deleteProfile, upload };
