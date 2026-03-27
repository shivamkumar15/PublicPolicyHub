import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import User from './models/User.js';
import Post from './models/Post.js';
import City from './models/City.js';
import Notification from './models/Notification.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'better_india_secret_key_123';

// Middleware
app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// --- Auth Routes ---

app.post('/api/auth/firebaseLogin', async (req, res) => {
  const { uid, email, displayName } = req.body;
  
  if (!uid || !email) return res.status(400).json({ error: 'Firebase Authentication payload invalid.' });

  try {
    const usernameDisplay = displayName || email.split('@')[0];
    let user = await User.findOne({ username: usernameDisplay });
    
    if (!user) {
      user = new User({
        username: usernameDisplay,
        role: 'CitizenReporter',
        password_hash: 'firebase_oauth'
      });
      await user.save();
    }
    
    const token = jwt.sign(
      { username: user.username, role: user.role, email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ token, username: user.username, role: user.role });
  } catch (error) {
    console.error('Firebase Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- User Profile Routes ---

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const postsCount = await Post.countDocuments({ author: req.user.username });
    
    res.json({
      username: req.user.username,
      role: req.user.role,
      reputation: 540 + postsCount * 10,
      badges: ['Public Watchdog', 'Active Reporter'],
      streak: '7d',
      postsCount: postsCount,
      solutionsProposed: 8
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// --- Content Routes ---

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ _id: -1 }).lean();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.post('/api/posts', authenticateToken, async (req, res) => {
  const { location, department, title, description, media } = req.body;
  
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

  const id = `post_${Date.now()}`;
  const author = req.user.username; 
  const time = 'Just now';
  const fixes = ['Awaiting suggested fixes'];

  try {
    const newPost = new Post({
      id, location: location || 'India', department: department || 'General', 
      title, description, author, time, media: media || 'IMAGE', 
      tag: department || 'Issue', accent: 'from-slate-900 via-slate-800 to-slate-700', 
      fixes
    });
    
    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const cities = await City.find().sort({ issues: -1 }).lean();
    res.json(cities);
  } catch {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ created_at: -1 }).limit(10).lean();
    res.json(notifications.map(n => n.message));
  } catch {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(PORT, () => console.log(`Backend server listening at http://localhost:${PORT}`));
