import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

dotenv.config();

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
    let userQuery = await query('SELECT * FROM users WHERE username = $1', [email]);
    
    if (userQuery.rows.length === 0) {
      await query('INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3)', [email, 'CitizenReporter', 'firebase_oauth']);
      userQuery = await query('SELECT * FROM users WHERE username = $1', [email]);
    }
    
    const user = userQuery.rows[0];
    const usernameDisplay = displayName || email.split('@')[0];
    
    const token = jwt.sign(
      { username: usernameDisplay, role: user.role, email: user.username }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ token, username: usernameDisplay, role: user.role });
  } catch (error) {
    console.error('Firebase Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- User Profile Routes ---

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query('SELECT COUNT(*) as posts_count FROM posts WHERE author = $1', [req.user.username]);
    
    res.json({
      username: req.user.username,
      role: req.user.role,
      reputation: 540 + parseInt(rows[0].posts_count) * 10,
      badges: ['Public Watchdog', 'Active Reporter'],
      streak: '7d',
      postsCount: parseInt(rows[0].posts_count),
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
    const { rows } = await query('SELECT * FROM posts ORDER BY time DESC;');
    res.json(rows);
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
  const fixes = JSON.stringify(['Awaiting suggested fixes']);

  try {
    const { rows } = await query(
      `INSERT INTO posts (id, location, department, title, description, author, time, media, tag, accent, fixes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;`,
      [id, location || 'India', department || 'General', title, description, author, time, media || 'IMAGE', department || 'Issue', 'from-slate-900 via-slate-800 to-slate-700', fixes]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM cities ORDER BY issues DESC;');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/api/notifications', async (req, res) => {
  try {
    const { rows } = await query('SELECT message FROM notifications ORDER BY created_at DESC LIMIT 10;');
    res.json(rows.map(r => r.message));
  } catch (error) {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(PORT, () => console.log(`Backend server listening at http://localhost:${PORT}`));
