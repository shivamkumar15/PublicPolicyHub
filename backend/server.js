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
import { spawn } from 'child_process';

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
const VIDEO_QUALITY_PRESETS = [
  { label: '144p', height: 144, videoBitrate: '180k', audioBitrate: '48k', bufferSize: '300k' },
  { label: '480p', height: 480, videoBitrate: '1200k', audioBitrate: '96k', bufferSize: '1800k' },
];
const ffmpegAvailability = {
  checked: false,
  available: false,
};

const runCommand = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';

  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  child.on('error', reject);
  child.on('close', (code) => {
    if (code === 0) {
      resolve();
      return;
    }
    reject(new Error(`${command} exited with code ${code}. ${stderr.trim()}`));
  });
});

const ensureFfmpegAvailable = async () => {
  if (ffmpegAvailability.checked) return ffmpegAvailability.available;

  try {
    await runCommand('ffmpeg', ['-version']);
    ffmpegAvailability.available = true;
  } catch {
    ffmpegAvailability.available = false;
    console.warn('ffmpeg was not found. Video quality variants (144p/480p) will be skipped.');
  }

  ffmpegAvailability.checked = true;
  return ffmpegAvailability.available;
};

const transcodeVideoQualities = async (file) => {
  const isFfmpegReady = await ensureFfmpegAvailable();
  if (!isFfmpegReady) return {};

  const qualities = {};
  const parsedFileName = path.parse(file.filename);
  const sourcePath = path.resolve(file.path);

  for (const preset of VIDEO_QUALITY_PRESETS) {
    const outputFilename = `${parsedFileName.name}-${preset.label}.mp4`;
    const outputPath = path.resolve('uploads', outputFilename);

    try {
      await runCommand('ffmpeg', [
        '-y',
        '-i',
        sourcePath,
        '-map',
        '0:v:0',
        '-map',
        '0:a:0?',
        '-vf',
        `scale=-2:${preset.height}`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-b:v',
        preset.videoBitrate,
        '-maxrate',
        preset.videoBitrate,
        '-bufsize',
        preset.bufferSize,
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        preset.audioBitrate,
        outputPath,
      ]);

      qualities[preset.label] = `/uploads/${outputFilename}`;
    } catch (error) {
      console.error(`Failed to transcode ${file.filename} at ${preset.label}:`, error.message);
    }
  }

  return qualities;
};

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

const normalizeDiscussionEntry = (entry, index, path = []) => {
  if (typeof entry === 'string') {
    const text = entry.trim();
    if (!text) return null;
    return {
      author: 'Community member',
      text,
      createdAt: null,
      upvoters: [],
      downvoters: [],
      score: 0,
      replies: [],
      replyCount: 0,
      path,
      sourceIndex: index,
      key: `legacy-${path.length > 0 ? path.join('-') : index}`,
    };
  }

  const text = `${entry?.text ?? ''}`.trim();
  if (!text) return null;

  const upvoters = Array.isArray(entry?.upvoters)
    ? [...new Set(entry.upvoters.filter((value) => typeof value === 'string' && value.trim()))]
    : [];
  const downvoters = Array.isArray(entry?.downvoters)
    ? [...new Set(entry.downvoters.filter((value) => typeof value === 'string' && value.trim()))]
    : [];
  const replies = (Array.isArray(entry?.replies) ? entry.replies : [])
    .map((reply, replyIndex) => normalizeDiscussionEntry(reply, index, [...path, replyIndex]))
    .filter(Boolean);

  return {
    author: `${entry?.author ?? 'Community member'}`.trim() || 'Community member',
    text,
    createdAt: entry?.createdAt ?? null,
    upvoters,
    downvoters,
    score: upvoters.length - downvoters.length,
    replies,
    replyCount: replies.length,
    path,
    sourceIndex: index,
    key: entry?.key || `${entry?.author ?? 'community'}-${path.length > 0 ? path.join('-') : index}-${entry?.createdAt ?? index}`,
  };
};

const normalizeSolution = (solution, index) => normalizeDiscussionEntry(solution, index, []);

const getSolutionIndex = (value) => {
  const parsed = Number.parseInt(`${value ?? ''}`, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : -1;
};

const parseReplyPath = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => Number.parseInt(`${entry}`, 10))
    .filter((entry) => Number.isInteger(entry) && entry >= 0);
};

const createDiscussionEntry = (author, text) => ({
  author,
  text,
  createdAt: new Date(),
  upvoters: [],
  downvoters: [],
  replies: [],
});

const ensureWritableSolution = (post, solutionIndex) => {
  if (!Array.isArray(post?.solutionsList)) post.solutionsList = [];

  const rawSolution = post.solutionsList[solutionIndex];
  if (!rawSolution) return null;

  if (typeof rawSolution === 'string') {
    const text = rawSolution.trim();
    if (!text) return null;
    post.solutionsList[solutionIndex] = {
      ...createDiscussionEntry('Community member', text),
    };
  }

  const solution = post.solutionsList[solutionIndex];
  if (!solution?.text) return null;
  if (!Array.isArray(solution.upvoters)) solution.upvoters = [];
  if (!Array.isArray(solution.downvoters)) solution.downvoters = [];
  if (!Array.isArray(solution.replies)) solution.replies = [];
  return solution;
};

const ensureWritableDiscussionEntry = (entry, fallbackAuthor = 'Community member') => {
  if (!entry) return null;

  if (typeof entry === 'string') {
    const text = entry.trim();
    if (!text) return null;
    return createDiscussionEntry(fallbackAuthor, text);
  }

  const text = `${entry?.text ?? ''}`.trim();
  if (!text) return null;

  if (!Array.isArray(entry.upvoters)) entry.upvoters = [];
  if (!Array.isArray(entry.downvoters)) entry.downvoters = [];
  if (!Array.isArray(entry.replies)) entry.replies = [];
  return entry;
};

const ensureWritableDiscussionTarget = (solution, replyPath = []) => {
  const normalizedPath = parseReplyPath(replyPath);
  let currentEntry = ensureWritableDiscussionEntry(solution);
  if (!currentEntry) return null;

  for (let index = 0; index < normalizedPath.length; index += 1) {
    const replyIndex = normalizedPath[index];
    if (!Array.isArray(currentEntry.replies)) currentEntry.replies = [];

    const rawReply = currentEntry.replies[replyIndex];
    if (rawReply == null) return null;

    if (typeof rawReply === 'string') {
      const upgradedReply = ensureWritableDiscussionEntry(rawReply);
      if (!upgradedReply) return null;
      currentEntry.replies[replyIndex] = upgradedReply;
    }

    currentEntry = ensureWritableDiscussionEntry(currentEntry.replies[replyIndex]);
    if (!currentEntry) return null;
  }

  return currentEntry;
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
    solutionsList: Array.isArray(source?.solutionsList)
      ? source.solutionsList.map(normalizeSolution).filter(Boolean)
      : [],
    fixes: Array.isArray(source?.fixes) ? source.fixes : [],
    mediaList: Array.isArray(source?.mediaList)
      ? source.mediaList.map((item) => {
          const mediaItem = item?.toObject ? item.toObject() : item;
          const qualities = mediaItem?.qualities instanceof Map
            ? Object.fromEntries(mediaItem.qualities.entries())
            : mediaItem?.qualities && typeof mediaItem.qualities === 'object'
              ? mediaItem.qualities
              : undefined;

          return {
            ...mediaItem,
            qualities,
            sources: Array.isArray(mediaItem?.sources) ? mediaItem.sources : [],
          };
        })
      : [],
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

const broadcastPostDelete = (postId) => {
  const payload = JSON.stringify({
    type: 'deleted',
    postId,
  });

  for (const client of sseClients) {
    client.write(`event: post_update\n`);
    client.write(`data: ${payload}\n\n`);
  }
};

const addUploadFilePathFromUrl = (url, filePaths) => {
  if (typeof url !== 'string') return;
  const normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('/uploads/')) return;

  const filename = path.basename(normalizedUrl);
  if (!filename) return;

  filePaths.add(path.resolve('uploads', filename));
};

const collectPostMediaFilePaths = (post) => {
  const filePaths = new Set();
  const mediaList = Array.isArray(post?.mediaList) ? post.mediaList : [];

  for (const mediaItemRaw of mediaList) {
    const mediaItem = mediaItemRaw?.toObject ? mediaItemRaw.toObject() : mediaItemRaw;
    addUploadFilePathFromUrl(mediaItem?.url, filePaths);

    if (mediaItem?.qualities instanceof Map) {
      for (const qualityUrl of mediaItem.qualities.values()) {
        addUploadFilePathFromUrl(qualityUrl, filePaths);
      }
    } else if (mediaItem?.qualities && typeof mediaItem.qualities === 'object') {
      for (const qualityUrl of Object.values(mediaItem.qualities)) {
        addUploadFilePathFromUrl(qualityUrl, filePaths);
      }
    }

    if (Array.isArray(mediaItem?.sources)) {
      for (const source of mediaItem.sources) {
        addUploadFilePathFromUrl(source?.url, filePaths);
      }
    }
  }

  return [...filePaths];
};

const deleteFileIfExists = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
};

const normalizeEmail = (emailValue) => `${emailValue ?? ''}`.trim().toLowerCase();

const sanitizeUsername = (value) => {
  const cleaned = `${value ?? ''}`
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  return cleaned || 'citizen';
};

const generateUniqueUsername = async (rawUsername, uid) => {
  const baseUsername = sanitizeUsername(rawUsername).slice(0, 24);
  if (!await User.exists({ username: baseUsername })) return baseUsername;

  const uidSuffix = sanitizeUsername(uid).slice(-6) || `${Date.now()}`.slice(-6);
  const candidateWithUid = `${baseUsername.slice(0, Math.max(1, 24 - uidSuffix.length - 1))}_${uidSuffix}`;
  if (!await User.exists({ username: candidateWithUid })) return candidateWithUid;

  let counter = 1;
  while (counter <= 5000) {
    const suffix = `_${counter}`;
    const candidate = `${baseUsername.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    if (!await User.exists({ username: candidate })) return candidate;
    counter += 1;
  }

  throw new Error('Unable to generate a unique username');
};

// Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    if (decoded?.sub) {
      user = await User.findById(decoded.sub);
      if (!user) return res.status(401).json({ error: 'Account not found. Please login again.' });
    }

    if (!user && decoded?.uid) {
      user = await User.findOne({ firebase_uid: decoded.uid });
    }

    if (!user && decoded?.email) {
      user = await User.findOne({ email: normalizeEmail(decoded.email) });
    }

    if (!user && decoded?.username) {
      user = await User.findOne({ username: decoded.username });
    }

    if (!user) return res.status(401).json({ error: 'Account not found. Please login again.' });

    req.user = {
      id: user._id.toString(),
      uid: user.firebase_uid || '',
      username: user.username,
      role: user.role,
      email: user.email || '',
    };
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

// --- Auth Routes ---

app.post('/api/auth/firebaseLogin', async (req, res) => {
  const { uid, email, displayName } = req.body;
  
  if (!uid || !email) return res.status(400).json({ error: 'Firebase Authentication payload invalid.' });

  try {
    const normalizedUid = `${uid}`.trim();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedUid || !normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Firebase Authentication payload invalid.' });
    }

    let user = await User.findOne({ firebase_uid: normalizedUid });
    
    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (!user) {
      const preferredName = displayName || normalizedEmail.split('@')[0];
      const username = await generateUniqueUsername(preferredName, normalizedUid);
      user = new User({
        username,
        firebase_uid: normalizedUid,
        email: normalizedEmail,
        role: 'CitizenReporter',
        password_hash: 'firebase_oauth'
      });
    } else {
      if (user.firebase_uid && user.firebase_uid !== normalizedUid) {
        return res.status(409).json({ error: 'This account is already linked to another login.' });
      }

      if (!user.firebase_uid) user.firebase_uid = normalizedUid;

      const canUpdateEmail = !user.email || user.email === normalizedEmail;
      if (!canUpdateEmail) {
        const emailOwner = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
        if (emailOwner) {
          return res.status(409).json({ error: 'Email already belongs to another account.' });
        }
      }

      user.email = normalizedEmail;
    }

    await user.save();
    
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        uid: user.firebase_uid || '',
        username: user.username,
        role: user.role,
        email: user.email || normalizedEmail,
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({ token, username: user.username, role: user.role, uid: user.firebase_uid || '' });
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
  } catch {
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
    mediaList = await Promise.all(req.files.map(async (file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const baseMedia = {
        type: isVideo ? 'VIDEO' : 'IMAGE',
        url: `/uploads/${file.filename}`,
      };

      if (!isVideo) return baseMedia;

      const qualities = await transcodeVideoQualities(file);
      if (Object.keys(qualities).length === 0) return baseMedia;

      const sources = Object.entries(qualities).map(([quality, url]) => ({
        label: quality,
        quality,
        url,
      }));

      return {
        ...baseMedia,
        qualities,
        sources,
      };
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

app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.author !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    const mediaFilePaths = collectPostMediaFilePaths(post);
    await Post.deleteOne({ _id: post._id });

    await Promise.all(
      mediaFilePaths.map(async (mediaFilePath) => {
        try {
          await deleteFileIfExists(mediaFilePath);
        } catch (error) {
          console.error(`Failed to delete media file ${mediaFilePath}:`, error.message);
        }
      })
    );

    broadcastPostDelete(post.id);
    res.json({ ok: true, id: post.id });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
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
      upvoters: [],
      downvoters: [],
      replies: [],
    });
    post.solutions = post.solutionsList.length;

    if (!Array.isArray(post.fixes)) post.fixes = [];
    if (!post.fixes.includes(text)) post.fixes.unshift(text);
    post.fixes = post.fixes.slice(0, 8);

    post.markModified('solutionsList');
    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error adding solution:', error);
    res.status(500).json({ error: 'Failed to add solution' });
  }
});

app.post('/api/posts/:postId/solutions/:solutionIndex/vote', authenticateToken, async (req, res) => {
  const solutionIndex = getSolutionIndex(req.params.solutionIndex);
  const voteType = `${req.body?.voteType ?? ''}`.trim().toLowerCase();
  const targetPath = parseReplyPath(req.body?.targetPath);

  if (solutionIndex < 0) return res.status(400).json({ error: 'Solution not found' });
  if (!['up', 'down', 'clear-up', 'clear-down'].includes(voteType)) {
    return res.status(400).json({ error: 'Vote type must be up, down, clear-up, or clear-down' });
  }

  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const solution = ensureWritableSolution(post, solutionIndex);
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    const targetEntry = ensureWritableDiscussionTarget(solution, targetPath);
    if (!targetEntry) return res.status(404).json({ error: 'Reply not found' });

    const username = req.user.username;
    const hadUpvote = Array.isArray(targetEntry.upvoters) && targetEntry.upvoters.includes(username);
    const hadDownvote = Array.isArray(targetEntry.downvoters) && targetEntry.downvoters.includes(username);
    targetEntry.upvoters = targetEntry.upvoters.filter((value) => value !== username);
    targetEntry.downvoters = targetEntry.downvoters.filter((value) => value !== username);

    if (voteType === 'up' && !hadUpvote) {
      targetEntry.upvoters.push(username);
    }
    if (voteType === 'down' && !hadDownvote) {
      targetEntry.downvoters.push(username);
    }

    post.markModified('solutionsList');
    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error voting on solution:', error);
    res.status(500).json({ error: 'Failed to update solution vote' });
  }
});

app.post('/api/posts/:postId/solutions/:solutionIndex/replies', authenticateToken, async (req, res) => {
  const solutionIndex = getSolutionIndex(req.params.solutionIndex);
  const text = `${req.body?.text ?? ''}`.trim();
  const parentPath = parseReplyPath(req.body?.parentPath);

  if (solutionIndex < 0) return res.status(400).json({ error: 'Solution not found' });
  if (!text) return res.status(400).json({ error: 'Reply text is required' });

  try {
    const post = await Post.findOne({ id: req.params.postId });
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const solution = ensureWritableSolution(post, solutionIndex);
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    const parentEntry = ensureWritableDiscussionTarget(solution, parentPath);
    if (!parentEntry) return res.status(404).json({ error: 'Reply target not found' });

    parentEntry.replies.push(createDiscussionEntry(req.user.username, text));

    post.markModified('solutionsList');
    await post.save();
    broadcastPostUpdate(post);
    res.json(normalizePost(post));
  } catch (error) {
    console.error('Error replying to solution:', error);
    res.status(500).json({ error: 'Failed to add solution reply' });
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
