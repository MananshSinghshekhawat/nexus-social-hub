const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

// Add headers to allow media resources to be embedded in the strictly isolated frontend
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    res.on('finish', () => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url} ${res.statusCode}`);
    });
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/post');
const userRoutes = require('./routes/user');
const socialRoutes = require('./routes/social');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', require('./routes/message'));
app.use('/api/admin', require('./routes/admin'));

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Authenticated user joins their own room for private messages/notifications
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined their room`);
    });

    // Handle real-time chat
    socket.on('send_message', (data) => {
        // module.exports = { createPost, getPosts, getPostById, deletePost, upload };
        io.to(data.receiverId).emit('receive_message', data);
    });

    // Handle real-time notifications
    socket.on('new_notification', (data) => {
        // data: { userId, actorId, type, postId }
        io.to(data.userId).emit('notification_received', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Basic route
app.get('/', (req, res) => {
    res.send('Nexus Social Hub API is running...');
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Global error error handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).send({ error: err.message || 'Something went wrong!' });
});

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err.message);
    });
