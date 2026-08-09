const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middlewares/requireAuth');

router.post('/google', authController.googleAuth);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOtp);
router.post('/register', authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-preview', authController.verifyPreview);

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
