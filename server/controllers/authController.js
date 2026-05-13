const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const activityTracker = require('../middleware/activityTracker');

const register = async (req, res) => {
    try {
        const { username, email, password, display_name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).send({ error: 'Username or email already exists.' });
        }

        const user = new User({ username, email, password, display_name });
        await user.save();

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).send({ error: 'Invalid login credentials' });
        }

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
        
        // Track login activity
        await activityTracker.trackLogin(user._id);
        
        res.send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
};

const getMe = async (req, res) => {
    res.send(req.user);
};

const updatePassword = async (req, res) => {
    try {
        const { password } = req.body;
        req.user.password = password;
        await req.user.save();
        res.send({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).send(error);
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).send({ error: 'User with this email does not exist.' });
        }

        // Generate reset token
        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${req.get('origin')}/reset-password/${token}`;

        // Send email
        let transporter;
        let isDevMode = false;

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            isDevMode = true;
            console.log('Using Ethereal Mail for development mode...');
            const testAccount = await nodemailer.createTestAccount();
            
            transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: testAccount.user, // generated ethereal user
                    pass: testAccount.pass, // generated ethereal password
                },
            });
        } else {
            transporter = nodemailer.createTransport({
                service: 'gmail', // You can change this or use SMTP
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }

        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER || '"Nexus Logic" <noreply@nexuslogic.local>',
            subject: 'Nexus Logic Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
                `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
                `${resetUrl}\n\n` +
                `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        const info = await transporter.sendMail(mailOptions);

        if (isDevMode) {
             const previewUrl = nodemailer.getTestMessageUrl(info);
             console.log('\n======================================================');
             console.log(' DEVELOPMENT MODE: EMAIL SENT VIA ETHEREAL MAIL');
             console.log(` Preview URL: ${previewUrl}`);
             console.log(` Or directly use this link: ${resetUrl}`);
             console.log('======================================================\n');
             return res.send({ message: 'Development mode: Password reset link has been logged to the server console.', previewUrl });
        } else {
             res.send({ message: 'An e-mail has been sent to ' + user.email + ' with further instructions.' });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).send({ error: 'Error sending password reset email' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send({ error: 'Password reset token is invalid or has expired.' });
        }

        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.send({ message: 'Your password has been changed.' });
    } catch (error) {
        res.status(400).send(error);
    }
};

module.exports = { register, login, getMe, updatePassword, forgotPassword, resetPassword };
