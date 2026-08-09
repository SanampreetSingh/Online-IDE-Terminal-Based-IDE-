const OAuth2Client = require('google-auth-library').OAuth2Client;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model.js');
const Map = require('../models/map.model.js');
const Otp = require('../models/otp.model.js');
const emailService = require('../services/email.service.js');
const env = require('../config/env.config.js');

const client = new OAuth2Client(env.googleClientId);

/**
 * Google OAuth Controller
 */
const googleAuth = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Token is required" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: env.googleClientId,
        });

        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;

        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.create({ name, email, googleId, picture });
        } else if (user.email !== email) {
            user.email = email;
            await user.save();
        }

        const backendToken = jwt.sign(
            { userId: user._id },
            env.jwtSecret,
            { expiresIn: '7d' }
        );

        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
        
        res.cookie('token', backendToken, {
            httpOnly: true,
            secure: !isLocal,
            sameSite: 'Lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            token: backendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture,
            }
        });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ error: "Invalid Google Token" });
    }
};

/**
 * Gatekeeper for Nginx auth_request.
 */
const verifyPreview = async (req, res) => {
    try {
        console.log("Verifying preview access...");

        const token = req.cookies.token;
        console.log("Token from cookie:", token);
        const targetUserId = req.headers['x-target-user'];

        if (!token || !targetUserId) {
            return res.sendStatus(401);
        }

        const decoded = jwt.verify(token, env.jwtSecret);
        console.log("Decoded JWT:", decoded); 

        if (decoded.userId !== targetUserId) {
            console.warn(`User ${decoded.userId} attempted to access preview for user ${targetUserId}`);
            return res.sendStatus(403);
        }

        const mapping = await Map.findOne({ userId: targetUserId });

        if (!mapping || mapping.status !== 'active') {
            return res.sendStatus(404); 
        }
        
        await Map.updateOne(
            { userId: targetUserId },
            { $set: { lastActive: new Date() } }
        );

        return res.sendStatus(200); 

    } catch (err) {
        console.error("Preview Verification Error:", err.message);
        res.sendStatus(401); 
    }
};

/**
 * 1. Send OTP Controller
 * Takes email and type ('register' or 'forgot'/'forget_password').
 * Checks user presence depending on type, generates 6-digit OTP, stores it in Otp model, and emails it.
 */
const sendOtp = async (req, res) => {
    try {
        const { email, type } = req.body;

        if (!email || !type) {
            return res.status(400).json({ error: "Email and OTP type are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const isForgotType = type === 'forgot' || type === 'forget_password';

        // 1. Check user presence based on type
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (isForgotType && !existingUser) {
            return res.status(404).json({ error: "User not found with this email" });
        }

        if (type === 'register' && existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpType = isForgotType ? 'forget_password' : 'register';

        // 3. Remove old OTPs for this email and type, then store new OTP
        await Otp.deleteMany({ emailId: normalizedEmail, type: otpType });
        await Otp.create({
            emailId: normalizedEmail,
            otp,
            type: otpType
        });

        // 4. Send Email
        await emailService.sendOTP(normalizedEmail, otp);

        return res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        console.error("Send OTP Error:", error);
        return res.status(500).json({ error: "Failed to send OTP" });
    }
};

/**
 * 2. Register Controller
 * Takes name, email, password, otp.
 * Checks email & OTP, deletes OTP, hashes password, creates User, and issues JWT cookie & token response.
 */
const register = async (req, res) => {
    try {
        const { name, email, password, otp } = req.body;

        if (!name || !email || !password || !otp) {
            return res.status(400).json({ error: "Name, email, password, and OTP are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Safety check: Email not already registered
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: "Email is already registered" });
        }

        // 2. Validate OTP
        const otpRecord = await Otp.findOne({
            emailId: normalizedEmail,
            otp,
            type: 'register'
        });

        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // 3. Delete used OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        // 4. Hash password & create user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword
        });

        // 5. Sign JWT & set cookie
        const backendToken = jwt.sign(
            { userId: user._id },
            env.jwtSecret,
            { expiresIn: '7d' }
        );

        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

        res.cookie('token', backendToken, {
            httpOnly: true,
            secure: !isLocal,
            sameSite: 'Lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            token: backendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        });
    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ error: "Registration failed" });
    }
};

/**
 * 3. Email & Password Login Controller
 * Takes email and password.
 * Validates user & password via bcrypt, issues JWT token and HTTP-only cookie.
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Find user & explicitly select password field
        const user = await User.findOne({ email: normalizedEmail }).select('+password');

        if (!user || !user.password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // 2. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // 3. Sign JWT & set cookie
        const backendToken = jwt.sign(
            { userId: user._id },
            env.jwtSecret,
            { expiresIn: '7d' }
        );

        const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

        res.cookie('token', backendToken, {
            httpOnly: true,
            secure: !isLocal,
            sameSite: 'Lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            token: backendToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                picture: user.picture
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
};

/**
 * 4. Forgot Password Controller
 * Takes email, otp, and newPassword.
 * Validates OTP, updates password, deletes OTP. Returns success response with no login/cookies.
 */
const forgotPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: "Email, OTP, and new password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 1. Check if user exists
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (!user) {
            return res.status(404).json({ error: "User not found with this email" });
        }

        // 2. Validate OTP
        const otpRecord = await Otp.findOne({
            emailId: normalizedEmail,
            otp,
            type: { $in: ['forget_password', 'forgot'] }
        });

        if (!otpRecord) {
            return res.status(400).json({ error: "Invalid or expired OTP" });
        }

        // 3. Delete used OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        // 4. Hash new password & update user
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
};

module.exports = {
    googleAuth,
    verifyPreview,
    sendOtp,
    register,
    login,
    forgotPassword
};