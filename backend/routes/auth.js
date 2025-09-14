const express = require('express');
// const bcrypt = require('bcrypt');
// const { authMiddleware, requireRole, redisClient } = require('../middleware/auth');
// const User = require('../models/User');
// const jwt = require('jsonwebtoken');
// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
// const { OAuth2Client } = require('google-auth-library');
// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
// const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const router = express.Router();

// POST /register (admin only)
// router.post('/register', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { username, password, role } = req.body;
//     if (!username || !password || !role) {
//       return res.status(400).json({ message: 'Username, password, and role are required.' });
//     }
//     if (!['editor', 'viewer'].includes(role)) {
//       return res.status(400).json({ message: 'Role must be editor or viewer.' });
//     }
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Username already exists.' });
//     }
//     const passwordHash = await bcrypt.hash(password, 10);
//     const user = new User({ username, passwordHash, role });
//     await user.save();
//     res.status(201).json({ message: 'User registered successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error registering user.', error: err.message });
//   }
// });

// POST /login
// router.post('/login', async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required.' });
//     }
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid username or password.' });
//     }
//     const valid = await bcrypt.compare(password, user.passwordHash);
//     if (!valid) {
//       return res.status(401).json({ message: 'Invalid username or password.' });
//     }
//     const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
//     // Store token in Redis with expiry (1 day)
//     await redisClient.set(token, user._id.toString(), { EX: 60 * 60 * 24 });
//     res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
//     res.json({ message: 'Login successful', role: user.role });
//   } catch (err) {
//     res.status(500).json({ message: 'Error logging in.', error: err.message });
//   }
// });

// POST /logout
// router.post('/logout', authMiddleware, async (req, res) => {
//   let token = null;
//   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//     token = req.headers.authorization.split(' ')[1];
//   } else if (req.cookies && req.cookies.token) {
//     token = req.cookies.token;
//   }
//   if (!token) {
//     return res.status(400).json({ message: 'No token provided' });
//   }
//   try {
//     await redisClient.del(token);
//     res.clearCookie('token');
//     res.json({ message: 'Logged out successfully' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error logging out', error: err.message });
//   }
// });

// GET /users (admin only)
// router.get('/users', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const users = await User.find({}, 'username role _id');
//     res.json(users);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching users', error: err.message });
//   }
// });

// POST /users (admin only)
// router.post('/users', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { username, password, role } = req.body;
//     if (!username || !password || !role) {
//       return res.status(400).json({ message: 'Username, password, and role are required.' });
//     }
//     if (!['admin', 'editor', 'viewer'].includes(role)) {
//       return res.status(400).json({ message: 'Invalid role.' });
//     }
//     const existingUser = await User.findOne({ username });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Username already exists.' });
//     }
//     const passwordHash = await bcrypt.hash(password, 10);
//     const user = new User({ username, passwordHash, role });
//     await user.save();
//     res.status(201).json({ message: 'User created successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error creating user', error: err.message });
//   }
// });

// DELETE /users/:id (admin only)
// router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     await User.findByIdAndDelete(id);
//     res.json({ message: 'User deleted successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error deleting user', error: err.message });
//   }
// });

// PATCH /users/:id (admin only)
// router.patch('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { password, role } = req.body;
//     const update = {};
//     if (password) {
//       update.passwordHash = await bcrypt.hash(password, 10);
//     }
//     if (role) {
//       if (!['admin', 'editor', 'viewer'].includes(role)) {
//         return res.status(400).json({ message: 'Invalid role.' });
//       }
//       update.role = role;
//     }
//     await User.findByIdAndUpdate(id, update);
//     res.json({ message: 'User updated successfully.' });
//   } catch (err) {
//     res.status(500).json({ message: 'Error updating user', error: err.message });
//   }
// });

// GET /me (authenticated user info)
// router.get('/me', authMiddleware, (req, res) => {
//   res.json({ username: req.user.username, role: req.user.role });
// });

// POST /google (Google OAuth login)
// router.post('/google', async (req, res) => {
//   try {
//     const { idToken } = req.body;
//     if (!idToken) {
//       return res.status(400).json({ message: 'No ID token provided.' });
//     }
//     // Verify Google ID token
//     const ticket = await googleClient.verifyIdToken({
//       idToken,
//       audience: GOOGLE_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();
//     const email = payload.email;
//     const googleId = payload.sub;
//     if (!email) {
//       return res.status(400).json({ message: 'No email in Google account.' });
//     }
//     // Find or create user
//     let user = await User.findOne({ $or: [ { email }, { googleId } ] });
//     if (!user) {
//       user = new User({
//         email,
//         googleId,
//         role: 'viewer', // Always assign viewer role by default
//       });
//       await user.save();
//     } else {
//       // Update googleId if missing
//       if (!user.googleId) {
//         user.googleId = googleId;
//         await user.save();
//       }
//     }
//     // Issue JWT and set cookie
//     const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
//     await redisClient.set(token, user._id.toString(), { EX: 60 * 60 * 24 });
//     res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/' });
//     res.json({ message: 'Login successful', role: user.role });
//   } catch (err) {
//     res.status(500).json({ message: 'Google login failed', error: err.message });
//   }
// });

module.exports = { router }; 