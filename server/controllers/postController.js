const Post = require('../models/Post');
const multer = require('multer');
const path = require('path');
const { Worker } = require('worker_threads');

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

        // Track 24h expiration for stories
        if (post_type === 'story') {
            post.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        // If it's a video type, trigger the background HLS transcoder worker
        const isVideoType = ['reel', 'shorts', 'video'].includes(post_type);
        if (isVideoType && video_url) {
            post.status = 'processing';
            post.resolutions = ['360p', '720p', '1080p'];
        }

        await post.save();

        if (isVideoType && video_url) {
            const absoluteInputPath = path.join(__dirname, '..', video_url); // Maps /uploads/...
            const absoluteOutputDir = path.join(__dirname, '..', 'uploads', 'hls', post._id.toString());

            const worker = new Worker(path.join(__dirname, '..', 'workers', 'hlsProcessor.js'), {
                workerData: {
                    inputPath: absoluteInputPath,
                    outputDir: absoluteOutputDir,
                    resolutions: post.resolutions
                }
            });

            worker.on('message', async (message) => {
                if (message.status === 'done') {
                    // Update the DB with the master playlist URL
                    post.hls_url = `/uploads/hls/${post._id.toString()}/${message.masterUrl}`;
                    post.status = 'ready';
                    await post.save();
                    console.log(`[HLS] Post ${post._id} finished transcoding.`);

                    // Optionally, broadcast readiness via Socket.io to the uploader
                    const io = req.app.get('io');
                    if (io) {
                        io.to(req.user._id.toString()).emit('post_ready', { postId: post._id });
                    }
                } else {
                    console.error(`[HLS] Processing error for Post ${post._id}:`, message.error);
                    post.status = 'failed';
                    await post.save();
                }
            });

            worker.on('error', async (error) => {
                console.error(`[HLS] Worker thread crashed for Post ${post._id}:`, error);
                post.status = 'failed';
                await post.save();
            });

            worker.on('exit', (code) => {
                if (code !== 0) console.error(`[HLS] Worker stopped with exit code ${code}`);
            });
        }

        // Story notifications for followers
        if (post_type === 'story') {
            const Follow = require('../models/Follow');
            const Notification = require('../models/Notification');
            const followers = await Follow.find({ following: req.user._id });

            const io = req.app.get('io');
            for (const f of followers) {
                const notification = new Notification({
                    user: f.follower,
                    actor: req.user._id,
                    type: 'story',
                    post: post._id
                });
                await notification.save();

                if (io) {
                    io.to(f.follower.toString()).emit('notification_received', {
                        type: 'story',
                        actor: {
                            _id: req.user._id,
                            username: req.user.username,
                            display_name: req.user.display_name,
                            avatar_url: req.user.avatar_url
                        },
                        post: post._id
                    });
                }
            }
        }

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
            if (type === 'story') {
                query.expires_at = { $gt: new Date() };
            }
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

const viewStory = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send({ error: 'Story not found' });

        if (post.post_type !== 'story') {
            return res.status(400).send({ error: 'Post is not a story' });
        }

        const alreadyViewed = post.story_views.some(v => v.user.toString() === req.user._id.toString());
        if (!alreadyViewed && post.user.toString() !== req.user._id.toString()) {
            post.story_views.push({ user: req.user._id });
            await post.save();
        }

        res.send(post);
    } catch (error) {
        res.status(500).send(error);
    }
};

module.exports = { createPost, getPosts, getPostById, deletePost, upload, viewStory };
