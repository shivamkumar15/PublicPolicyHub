import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { connectDB } from './db.js';
import User from './models/User.js';
import Post from './models/Post.js';
import City from './models/City.js';
import Notification from './models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'better_india_secret_key_123';
const sseClients = new Set();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const toCount = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    const multiplier = normalized.endsWith('m') ? 1000000 : normalized.endsWith('k') ? 1000 : 1;
    const numericPart = normalized.replace(/[^0-9.]/g, '');
    const parsedFloat = Number.parseFloat(numericPart);
    const parsed = Number.isFinite(parsedFloat) ? Math.round(parsedFloat * multiplier) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizePost = (post) => {
  const source = post?.toObject ? post.toObject() : post;
  return {
    ...source,
    support: toCount(source?.support),
    comments: toCount(source?.comments),
    solutions: toCount(source?.solutions),
    shares: toCount(source?.shares),
    supporters: Array.isArray(source?.supporters) ? source.supporters : [],
    commentsList: Array.isArray(source?.commentsList) ? source.commentsList : [],
    solutionsList: Array.isArray(source?.solutionsList) ? source.solutionsList : [],
    fixes: Array.isArray(source?.fixes) ? source.fixes : [],
    mediaList: Array.isArray(source?.mediaList) ? source.mediaList : [],
  };
};

const broadcastPostUpdate = (post, eventType = 'updated') => {
  const payload = JSON.stringify({
    type: eventType,
    post: normalizePost(post),
  });

  for (const client of sseClients) {
    client.write(`event: post_update\n`);
    client.write(`data: ${payload}\n\n`);
  }
};

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
    res.json(posts.map(normalizePost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('event: ready\ndata: {"ok":true}\n\n');

  sseClients.add(res);
  req.on('close', () => {
    sseClients.delete(res);
  });
});

app.post('/api/posts', authenticateToken, upload.array('files', 10), async (req, res) => {
  const { location, department, title, description, media } = req.body;
  
  if (!title || !description) return res.status(400).json({ error: 'Title and description are required' });

  const id = `post_${Date.now()}`;
  const author = req.user.username; 
  const time = 'Just now';
  const fixes = ['Awaiting suggested fixes'];

  let mediaList = [];
  if (req.files && req.files.length > 0) {
    mediaList = req.files.map(f => ({
      type: f.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      url: `/uploads/${f.filename}`
    }));
  }

  try {
    const newPost = new Post({
      id, location: location || 'India', department: department || 'General', 
      title, description, author, time, media: media || 'IMAGE', 
      tag: department || 'Issue', accent: 'from-slate-900 via-slate-800 to-slate-700', 
      fixes, mediaList
    });
    
    await newPost.save();
    broadcastPostUpdate(newPost, 'created');
    res.status(201).json(normalizePost(newPost));
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.post('/api/posts/:postId/support', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const currentSupportCount = toCount(post.support);
    if (!Array.isArray(post.supporters)) post.supporters = [];
    const existingIndex = post.supporters.findIndex((username) => username === req.user.username);

    if (existingIndex >= 0) {
      post.supporters.splice(existingIndex, 1);
      post.support = Math.max(currentSupportCount - 1, 0);
    } else {
      post.supporters.push(req.user.username);
      post.support = currentSupportCount + 1;
    }
    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error updating support:', error);
    res.status(500).json({ error: 'Failed to update support' });
  }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  const text = `${req.body?.text ?? ''}`.trim();
  if (!text) return res.status(400).json({ error: 'Comment text is required' });

  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!Array.isArray(post.commentsList)) post.commentsList = [];
    post.commentsList.push({
      author: req.user.username,
      text,
      createdAt: new Date(),
    });
    post.comments = post.commentsList.length;

    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.post('/api/posts/:postId/solutions', authenticateToken, async (req, res) => {
  const text = `${req.body?.text ?? ''}`.trim();
  if (!text) return res.status(400).json({ error: 'Solution text is required' });

  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!Array.isArray(post.solutionsList)) post.solutionsList = [];
    post.solutionsList.push({
      author: req.user.username,
      text,
      createdAt: new Date(),
    });
    post.solutions = post.solutionsList.length;

    if (!Array.isArray(post.fixes)) post.fixes = [];
    if (!post.fixes.includes(text)) post.fixes.unshift(text);
    post.fixes = post.fixes.slice(0, 8);

    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error adding solution:', error);
    res.status(500).json({ error: 'Failed to add solution' });
  }
});

app.post('/api/posts/:postId/share', async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    post.shares = toCount(post.shares) + 1;
    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({ error: 'Failed to update share' });
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
