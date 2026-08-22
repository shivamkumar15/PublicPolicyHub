import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { isSupabaseConfigured, supabase } from './db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import admin from 'firebase-admin';
import { Backend } from 'firebase/ai';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

// Initialize Firebase Admin
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const hasConfiguredFirebaseAdminValue = (value) => {
  const normalizedValue = `${value ?? ''}`.trim().toLowerCase();
  return !!normalizedValue
    && !normalizedValue.startsWith('your_')
    && !normalizedValue.startsWith('your-')
    && !normalizedValue.startsWith('replace_')
    && !normalizedValue.startsWith('replace-');
};

const hasFirebaseAdminConfig = hasConfiguredFirebaseAdminValue(firebaseAdminConfig.projectId)
  && hasConfiguredFirebaseAdminValue(firebaseAdminConfig.clientEmail)
  && `${firebaseAdminConfig.privateKey ?? ''}`.includes('BEGIN PRIVATE KEY');

if (hasFirebaseAdminConfig) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseAdminConfig),
    });
  } catch {
    console.warn('Firebase Admin SDK not initialized because the configured credentials could not be parsed.');
  }
} else {
  console.warn('Firebase Admin SDK not initialized. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profileMediaOverridesPath = path.resolve(__dirname, 'profile-media-overrides.json');



const app = express();
const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const sseClients = new Set();
const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const AI_SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;
const AI_SUMMARY_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const AI_SUMMARY_RATE_LIMIT_MAX_REQUESTS = 10;
const aiSummaryCache = new Map();
const aiSummaryRateLimitByIp = new Map();
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/ogg']);
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.webm', '.ogv']);
const INVALID_UPLOAD_TYPE_ERROR_MESSAGE = 'Only JPG, PNG, WEBP, GIF, MP4, MOV, WEBM, and OGV uploads are allowed.';

const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Supabase Storage (media persistence). Files are still written to the local
// uploads dir for processing (e.g. video transcoding) and are also mirrored to
// Supabase Storage so media survives and is served from the uploads bucket.
const SUPABASE_URL_RAW = process.env.SUPABASE_URL || '';
const supabaseUrlBase = SUPABASE_URL_RAW.replace(/\/$/, '');
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
const supabaseStorageBase = (isSupabaseConfigured && supabaseUrlBase)
  ? `${supabaseUrlBase}/storage/v1/object/public/${STORAGE_BUCKET}`
  : '';

const uploadFileToStorage = async (storagePath, localFilePath, contentType) => {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const buffer = fs.readFileSync(localFilePath);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: true,
      });
    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return null;
    }
    return storagePath;
  } catch (err) {
    console.error('Supabase storage upload failed:', err.message);
    return null;
  }
};

const deleteFromStorage = async (storagePath) => {
  if (!isSupabaseConfigured || !supabase || !storagePath) return;
  try {
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  } catch {
    /* best-effort */
  }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    services: {
      firebaseAdmin: admin.apps.length > 0,
      openai: Boolean(OPENAI_API_KEY),
      supabase: isSupabaseConfigured,
    },
  });
});
app.use('/api', (req, res, next) => {
  if (!isSupabaseConfigured) {
    return res.status(503).json({ error: 'Server configuration error: Supabase is not configured.' });
  }

  next();
});

const isAllowedUpload = (file, allowedMimeTypes, allowedExtensions) => {
  const mimeType = `${file?.mimetype ?? ''}`.trim().toLowerCase();
  const extension = path.extname(`${file?.originalname ?? ''}`).trim().toLowerCase();
  return allowedMimeTypes.has(mimeType) && allowedExtensions.has(extension);
};

const isAllowedImageUpload = (file) => isAllowedUpload(file, ALLOWED_IMAGE_MIME_TYPES, ALLOWED_IMAGE_EXTENSIONS);
const isAllowedVideoUpload = (file) => isAllowedUpload(file, ALLOWED_VIDEO_MIME_TYPES, ALLOWED_VIDEO_EXTENSIONS);
const isAllowedPostUpload = (file) => isAllowedImageUpload(file) || isAllowedVideoUpload(file);

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname).toLowerCase());
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedPostUpload(file)) {
      cb(null, true);
      return;
    }

    cb(new Error(INVALID_UPLOAD_TYPE_ERROR_MESSAGE));
  },
});
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
    const outputPath = path.resolve(UPLOADS_DIR, outputFilename);

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

const flattenDiscussionEntries = (entries = []) => (
  entries.flatMap((entry) => {
    const replies = Array.isArray(entry?.replies) ? flattenDiscussionEntries(entry.replies) : [];
    return [entry, ...replies];
  }).filter(Boolean)
);

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

const replaceUsernameInDiscussionEntry = (entry, currentUsername, nextUsername) => {
  if (!entry || typeof entry === 'string') return false;

  let hasChanges = false;

  if (`${entry.author ?? ''}`.trim() === currentUsername) {
    entry.author = nextUsername;
    hasChanges = true;
  }

  if (Array.isArray(entry.upvoters)) {
    const nextUpvoters = entry.upvoters.map((value) => (value === currentUsername ? nextUsername : value));
    if (nextUpvoters.some((value, index) => value !== entry.upvoters[index])) {
      entry.upvoters = nextUpvoters;
      hasChanges = true;
    }
  }

  if (Array.isArray(entry.downvoters)) {
    const nextDownvoters = entry.downvoters.map((value) => (value === currentUsername ? nextUsername : value));
    if (nextDownvoters.some((value, index) => value !== entry.downvoters[index])) {
      entry.downvoters = nextDownvoters;
      hasChanges = true;
    }
  }

  if (Array.isArray(entry.replies)) {
    entry.replies.forEach((reply) => {
      if (replaceUsernameInDiscussionEntry(reply, currentUsername, nextUsername)) {
        hasChanges = true;
      }
    });
  }

  return hasChanges;
};

const replaceUsernameInPost = (post, currentUsername, nextUsername) => {
  let hasChanges = false;

  if (`${post.author ?? ''}`.trim() === currentUsername) {
    post.author = nextUsername;
    hasChanges = true;
  }

  if (Array.isArray(post.supporters)) {
    const nextSupporters = post.supporters.map((value) => (value === currentUsername ? nextUsername : value));
    if (nextSupporters.some((value, index) => value !== post.supporters[index])) {
      post.supporters = nextSupporters;
      hasChanges = true;
    }
  }

  const commentsList = Array.isArray(post.comments_list)
    ? post.comments_list
    : (Array.isArray(post.commentsList) ? post.commentsList : []);
  commentsList.forEach((comment) => {
    if (`${comment?.author ?? ''}`.trim() === currentUsername) {
      comment.author = nextUsername;
      hasChanges = true;
    }
  });

  const solutionsList = Array.isArray(post.solutions_list)
    ? post.solutions_list
    : (Array.isArray(post.solutionsList) ? post.solutionsList : []);
  solutionsList.forEach((solution) => {
    if (replaceUsernameInDiscussionEntry(solution, currentUsername, nextUsername)) {
      hasChanges = true;
    }
  });

  return hasChanges;
};

const renameUserReferences = async (currentUsername, nextUsername) => {
  if (!currentUsername || !nextUsername || currentUsername === nextUsername) return;

  // Supabase doesn't have an exact equivalent to arrayFilters for nested updates in a single call easily for complex logic,
  // but for simple array replacements we can use array functions or fetch and update.
  
  // Update users table (following array)
  // This is tricky in SQL without a junction table, but we can use array_replace
  await supabase.rpc('rename_user_following', { old_username: currentUsername, new_username: nextUsername });

  // Update notifications
  await supabase.from('notifications').update({ recipient_username: nextUsername }).eq('recipient_username', currentUsername);
  await supabase.from('notifications').update({ actor_username: nextUsername }).eq('actor_username', currentUsername);

  // Update messages
  await supabase.from('messages').update({ sender_username: nextUsername }).eq('sender_username', currentUsername);
  await supabase.from('messages').update({ recipient_username: nextUsername }).eq('recipient_username', currentUsername);
  // participants is an array
  await supabase.rpc('rename_user_participants', { old_username: currentUsername, new_username: nextUsername });

  // Update posts
  const { data: posts, error: _error } = await supabase.from('posts')
    .select('*')
    .or(`author.eq.${currentUsername},supporters.cs.{${currentUsername}}`);

  if (posts) {
    for (const post of posts) {
      if (!replaceUsernameInPost(post, currentUsername, nextUsername)) continue;
      await supabase.from('posts').update(post).eq('id', post.id);
      broadcastPostUpdate(post);
    }
  }
};

const normalizePost = (post) => {
  const source = post;
  const createdAt = getPostCreatedAt(source);
  return {
    ...source,
    createdAt: createdAt ? createdAt.toISOString() : null,
    support: toCount(source?.support),
    comments: toCount(source?.comments),
    solutions: toCount(source?.solutions),
    shares: toCount(source?.shares),
    supporters: Array.isArray(source?.supporters) ? source.supporters : [],
    commentsList: Array.isArray(source?.comments_list) ? source.comments_list : (Array.isArray(source?.commentsList) ? source.commentsList : []),
    solutionsList: Array.isArray(source?.solutions_list)
      ? source.solutions_list.map(normalizeSolution).filter(Boolean)
      : (Array.isArray(source?.solutionsList) ? source.solutionsList.map(normalizeSolution).filter(Boolean) : []),
    fixes: Array.isArray(source?.fixes) ? source.fixes : [],
    mediaList: Array.isArray(source?.media_list)
      ? source.media_list.map((item) => {
          const mediaItem = item;
          const qualities = mediaItem?.qualities && typeof mediaItem.qualities === 'object'
              ? mediaItem.qualities
              : undefined;

          return {
            ...mediaItem,
            qualities,
            sources: Array.isArray(mediaItem?.sources) ? mediaItem.sources : [],
          };
        })
      : (Array.isArray(source?.mediaList) ? source.mediaList : []),
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

const serializeMessage = (message, viewerUsername = '') => {
  const source = message;
  const createdAt = source?.created_at
    ? new Date(source.created_at)
    : (source?.createdAt ? new Date(source.createdAt) : null);

  return {
    id: source?.id?.toString() || '',
    senderUsername: `${source?.sender_username ?? source?.senderUsername ?? ''}`.trim(),
    recipientUsername: `${source?.recipient_username ?? source?.recipientUsername ?? ''}`.trim(),
    text: `${source?.text ?? ''}`.trim(),
    read: !!source?.read,
    createdAt: createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
      ? createdAt.toISOString()
      : null,
    direction: `${source?.sender_username ?? source?.senderUsername ?? ''}`.trim() === `${viewerUsername ?? ''}`.trim() ? 'outgoing' : 'incoming',
  };
};

const buildParticipants = (...usernames) => (
  [...new Set(
    usernames
      .map((value) => `${value ?? ''}`.trim())
      .filter(Boolean)
  )].sort((firstValue, secondValue) => firstValue.localeCompare(secondValue))
);

const addUploadFilePathFromUrl = (url, filePaths) => {
  if (typeof url !== 'string') return;
  const normalizedUrl = url.trim();
  if (!normalizedUrl.startsWith('/uploads/')) return;

  const filename = path.basename(normalizedUrl);
  if (!filename) return;

  filePaths.add(path.resolve(UPLOADS_DIR, filename));
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

const ensureUploadedImageFile = async (file) => {
  if (!file) return { ok: false, error: 'Image file is required.' };
  if (isAllowedImageUpload(file)) return { ok: true, error: '' };

  await deleteFileIfExists(path.resolve(file.path));
  return { ok: false, error: 'Only JPG, PNG, WEBP, and GIF images are allowed.' };
};

const isMissingColumnError = (error, columnName) => {
  const errorText = [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return errorText.includes('column') && errorText.includes(`${columnName}`.toLowerCase());
};

const updateUserMediaColumn = async (userId, primaryColumn, fallbackColumn, value) => {
  const { error: primaryError } = await supabase.from('users').update({ [primaryColumn]: value }).eq('id', userId);
  if (!primaryError) return;
  if (!fallbackColumn || !isMissingColumnError(primaryError, primaryColumn)) throw primaryError;

  const { error: fallbackError } = await supabase.from('users').update({ [fallbackColumn]: value }).eq('id', userId);
  if (fallbackError) throw fallbackError;
};

const readProfileMediaOverrides = async () => {
  try {
    const fileContent = await fs.promises.readFile(profileMediaOverridesPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
};

const writeProfileMediaOverrides = async (overrides) => {
  await fs.promises.writeFile(profileMediaOverridesPath, JSON.stringify(overrides, null, 2));
};

const readUserMediaOverride = async (user) => {
  if (!user?.id && !user?.username) return {};
  const overrides = await readProfileMediaOverrides();
  return overrides[user.id] || overrides[user.username] || {};
};

const writeUserMediaOverride = async (user, nextOverride) => {
  if (!user?.id && !user?.username) return;
  const overrides = await readProfileMediaOverrides();
  const existingOverride = overrides[user.id] || overrides[user.username] || {};
  const mergedOverride = {
    ...existingOverride,
    username: user.username || existingOverride.username || '',
    ...nextOverride,
  };

  if (user.username && overrides[user.username]) delete overrides[user.username];
  overrides[user.id] = mergedOverride;
  await writeProfileMediaOverrides(overrides);
};

const getUserBannerUrl = async (user) => {
  const override = await readUserMediaOverride(user);
  return user?.banner_url || user?.bannerUrl || override.bannerUrl || '';
};

const normalizeEmail = (emailValue) => `${emailValue ?? ''}`.trim().toLowerCase();

const normalizeGender = (genderValue) => {
  const normalizedGender = `${genderValue ?? ''}`.trim().toLowerCase();
  if (!normalizedGender) return '';

  if (normalizedGender === 'female') return 'Female';
  if (normalizedGender === 'male') return 'Male';
  if (normalizedGender === 'non-binary' || normalizedGender === 'non binary') return 'Non-binary';
  if (normalizedGender === 'prefer not to say') return 'Prefer not to say';
  return '';
};

const normalizePhoneNumber = (phoneNumberValue) => `${phoneNumberValue ?? ''}`
  .trim()
  .replace(/[^\d+\s()-]/g, '');

const normalizeDisplayName = (value) => `${value ?? ''}`.trim().replace(/\s+/g, ' ');

const getVerifiedFirebaseEmail = (decoded) => (
  decoded?.email_verified === true ? normalizeEmail(decoded?.email) : ''
);

const getTrustedFirebasePhoneNumber = (decoded) => normalizePhoneNumber(decoded?.phone_number);

const validateSubmittedFirebaseIdentity = (decoded, payload) => {
  const submittedEmail = normalizeEmail(payload?.email);
  const submittedPhoneNumber = normalizePhoneNumber(payload?.phoneNumber);
  const trustedEmail = normalizeEmail(decoded?.email);
  const trustedPhoneNumber = getTrustedFirebasePhoneNumber(decoded);

  if (submittedEmail && submittedEmail !== trustedEmail) {
    return 'Submitted email does not match the authenticated Firebase account.';
  }

  if (submittedPhoneNumber && submittedPhoneNumber !== trustedPhoneNumber) {
    return 'Submitted phone number does not match the authenticated Firebase account.';
  }

  return '';
};

const normalizePersonalDescription = (value) => `${value ?? ''}`
  .trim()
  .replace(/\s+/g, ' ')
  .slice(0, 180);

const normalizeUsernameCandidate = (value) => `${value ?? ''}`
  .trim()
  .toLowerCase()
  .replace(/\s+/g, '_')
  .replace(/[^a-z0-9_]/g, '')
  .slice(0, 24);

const validateRequestedUsername = (value) => {
  const normalizedUsername = normalizeUsernameCandidate(value);
  if (!normalizedUsername) {
    return { normalizedUsername: '', error: 'Username is required.' };
  }

  if (normalizedUsername.length < 3) {
    return { normalizedUsername, error: 'Username must be at least 3 characters.' };
  }

  return { normalizedUsername, error: '' };
};

const findUserByNormalizedUsername = async (normalizedUsername) => {
  const { data, error: _error } = await supabase
    .from('users')
    .select('*')
    .ilike('username', normalizedUsername)
    .single();
  return data;
};

const findUserByFirebaseIdentity = async (decoded) => {
  const normalizedUid = `${decoded?.uid ?? ''}`.trim();
  if (!normalizedUid) return null;

  let { data: user } = await supabase.from('users').select('*').eq('firebase_uid', normalizedUid).single();
  if (user) return user;

  const verifiedEmail = getVerifiedFirebaseEmail(decoded);
  if (!verifiedEmail) return null;

  const { data } = await supabase.from('users').select('*').eq('email', verifiedEmail).single();
  return data || null;
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return `${req.ip || req.socket?.remoteAddress || 'unknown'}`;
};

const getCachedAiSummary = (cacheKey) => {
  const cachedSummary = aiSummaryCache.get(cacheKey);
  if (!cachedSummary) return null;

  if (cachedSummary.expiresAt <= Date.now()) {
    aiSummaryCache.delete(cacheKey);
    return null;
  }

  return cachedSummary.data;
};

const buildAiSummaryCacheKey = (post) => JSON.stringify({
  id: post?.id || '',
  solutions: getSolutionEntriesForSummary(post),
});

const consumeAiSummaryRateLimit = (req) => {
  const now = Date.now();
  const clientIp = getClientIp(req);
  const existingEntry = aiSummaryRateLimitByIp.get(clientIp);

  if (!existingEntry || existingEntry.resetAt <= now) {
    aiSummaryRateLimitByIp.set(clientIp, {
      count: 1,
      resetAt: now + AI_SUMMARY_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (existingEntry.count >= AI_SUMMARY_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  existingEntry.count += 1;
  return true;
};

const generateUniqueUsername = async (rawUsername, uid) => {
  const preferredBaseUsername = normalizeUsernameCandidate(rawUsername);
  const baseUsername = (
    preferredBaseUsername.length >= 3
      ? preferredBaseUsername
      : normalizeUsernameCandidate(`${preferredBaseUsername}citizen`)
  ) || 'citizen';
  
  const { data: exists } = await supabase.from('users').select('username').eq('username', baseUsername).single();
  if (!exists) return baseUsername;

  const uidSuffix = normalizeUsernameCandidate(uid).slice(-6) || `${Date.now()}`.slice(-6);
  const candidateWithUid = `${baseUsername.slice(0, Math.max(1, 24 - uidSuffix.length - 1))}_${uidSuffix}`;
  const { data: existsUid } = await supabase.from('users').select('username').eq('username', candidateWithUid).single();
  if (!existsUid) return candidateWithUid;

  let counter = 1;
  while (counter <= 5000) {
    const suffix = `_${counter}`;
    const candidate = `${baseUsername.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    const { data: existsCounter } = await supabase.from('users').select('username').eq('username', candidate).single();
    if (!existsCounter) return candidate;
    counter += 1;
  }

  throw new Error('Unable to generate a unique username');
};



// Auth Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  if (admin.apps.length === 0) {
    console.error('Auth verification error: Firebase Admin SDK not initialized.');
    return res.status(500).json({ error: 'Server configuration error: Firebase not initialized.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await findUserByFirebaseIdentity(decoded);

    if (!user) return res.status(401).json({ error: 'Account not found. Please sync your account.' });

    req.user = {
      id: user.id.toString(),
      uid: user.firebase_uid || '',
      username: user.username,
      role: user.role,
      email: user.email || '',
    };
    next();
  } catch (error) {
    console.error('Auth verification error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

const attachOptionalUser = async (req, _res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token || admin.apps.length === 0) {
    req.user = null;
    next();
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await findUserByFirebaseIdentity(decoded);

    req.user = user ? {
      id: user.id.toString(),
      uid: user.firebase_uid || '',
      username: user.username,
      role: user.role,
      email: user.email || '',
    } : null;
  } catch {
    req.user = null;
  }

  next();
};

const getUniqueStrings = (values) => (
  Array.isArray(values)
    ? [...new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))]
    : []
);

const getPostCreatedAt = (post) => {
  if (post?.createdAt instanceof Date && !Number.isNaN(post.createdAt.getTime())) {
    return post.createdAt;
  }

  if (post?.createdAt) {
    const parsedCreatedAt = new Date(post.createdAt);
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt;
  }

  if (post?.created_at instanceof Date && !Number.isNaN(post.created_at.getTime())) {
    return post.created_at;
  }

  if (post?.created_at) {
    const parsedCreatedAt = new Date(post.created_at);
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt;
  }

  if (post?._id && typeof post._id.getTimestamp === 'function') {
    const objectIdTimestamp = post._id.getTimestamp();
    if (objectIdTimestamp instanceof Date && !Number.isNaN(objectIdTimestamp.getTime())) {
      return objectIdTimestamp;
    }
  }

  return null;
};

const serializeNotification = (notification) => {
  const source = notification?.toObject ? notification.toObject() : notification;
  const createdAt = source?.created_at instanceof Date
    ? source.created_at
    : source?.created_at
      ? new Date(source.created_at)
      : null;

  return {
    id: `${source?.id ?? source?._id ?? ''}`.toString(),
    recipientUsername: `${source?.recipient_username ?? source?.recipientUsername ?? ''}`.trim(),
    actorUsername: `${source?.actor_username ?? source?.actorUsername ?? ''}`.trim(),
    type: `${source?.type ?? 'generic'}`.trim() || 'generic',
    message: `${source?.message ?? ''}`.trim(),
    postId: `${source?.post_id ?? source?.postId ?? ''}`.trim(),
    postTitle: `${source?.post_title ?? source?.postTitle ?? ''}`.trim(),
    read: !!source?.read,
    createdAt: createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
      ? createdAt.toISOString()
      : null,
  };
};

const createNotification = async ({
  recipientUsername = '',
  actorUsername = '',
  type = 'generic',
  message = '',
  postId = '',
  postTitle = '',
}) => {
  const normalizedRecipient = `${recipientUsername ?? ''}`.trim();
  const normalizedActor = `${actorUsername ?? ''}`.trim();
  const normalizedMessage = `${message ?? ''}`.trim();

  if (!normalizedRecipient || !normalizedMessage) return null;
  if (normalizedActor && normalizedActor === normalizedRecipient) return null;

  const { data, error } = await supabase.from('notifications').insert({
    recipient_username: normalizedRecipient,
    actor_username: normalizedActor,
    type: `${type ?? 'generic'}`.trim() || 'generic',
    message: normalizedMessage,
    post_id: `${postId ?? ''}`.trim(),
    post_title: `${postTitle ?? ''}`.trim(),
  }).select().single();

  if (error) {
    console.error('Failed to create notification:', error.message);
    return null;
  }

  return serializeNotification(data);
};

const getUserJoinedAt = (user) => {
  if (user?.createdAt instanceof Date && !Number.isNaN(user.createdAt.getTime())) {
    return user.createdAt;
  }

  if (user?.createdAt) {
    const parsedCreatedAt = new Date(user.createdAt);
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt;
  }

  if (user?.created_at instanceof Date && !Number.isNaN(user.created_at.getTime())) {
    return user.created_at;
  }

  if (user?.created_at) {
    const parsedCreatedAt = new Date(user.created_at);
    if (!Number.isNaN(parsedCreatedAt.getTime())) return parsedCreatedAt;
  }

  if (user?._id && typeof user._id.getTimestamp === 'function') {
    const objectIdTimestamp = user._id.getTimestamp();
    if (objectIdTimestamp instanceof Date && !Number.isNaN(objectIdTimestamp.getTime())) {
      return objectIdTimestamp;
    }
  }

  return null;
};

const buildProfilePayload = async (user, viewerUsername = '', options = {}) => {
  const includePrivateFields = !!options?.includePrivateFields;
  const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author', user.username);
  const { count: followerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).contains('following', [user.username]);
  const bannerUrl = await getUserBannerUrl(user);
  
  const following = getUniqueStrings(user.following);
  const bookmarkedPostIds = getUniqueStrings(user.bookmarked_post_ids || user.bookmarkedPostIds);
  const reportedPostIds = getUniqueStrings(user.reported_post_ids || user.reportedPostIds);
  const solutionsProposed = 8;
  const memberSince = getUserJoinedAt(user);

  const payload = {
    username: user.username,
    displayName: user.display_name || user.displayName || '',
    personalDescription: user.personal_description || user.personalDescription || '',
    role: user.role,
    gender: user.gender || '',
    reputation: 540 + (postsCount || 0) * 10,
    badges: ['Public Watchdog', 'Active Reporter'],
    streak: '7d',
    postsCount: postsCount || 0,
    solutionsProposed,
    profilePhotoUrl: user.profile_photo_url || user.profilePhotoUrl || '',
    bannerUrl,
    bookmarkedPostIds,
    following,
    followerCount: followerCount || 0,
    followingCount: following.length,
    isFollowing: !!viewerUsername && following.includes(viewerUsername),
    memberSince: memberSince ? memberSince.toISOString() : null,
  };

  if (includePrivateFields) {
    payload.email = user.email || '';
    payload.phoneNumber = user.phone_number || user.phoneNumber || '';
    payload.canChangePassword = !!user.password_hash && user.password_hash !== 'firebase_oauth';
    payload.reportedPostIds = reportedPostIds;
  }

  return payload;
};

const buildConnectionListEntry = (user, viewerFollowing = [], viewerUsername = '') => ({
  username: user.username,
  displayName: user.displayName || user.display_name || '',
  role: user.role || 'CitizenReporter',
  profilePhotoUrl: user.profilePhotoUrl || user.profile_photo_url || '',
  isOwnProfile: !!viewerUsername && user.username === viewerUsername,
  isFollowing: !!viewerUsername && viewerFollowing.includes(user.username),
});

const buildFallbackSolutionSummary = (solutionEntries) => {
  const topSolution = [...solutionEntries].sort((a, b) => {
    if (b.agree_count !== a.agree_count) return b.agree_count - a.agree_count;
    if (b.score !== a.score) return b.score - a.score;
    return b.reply_count - a.reply_count;
  })[0];

  return {
    most_agreed: topSolution?.text || 'No strong solution has emerged yet.',
    common_solution: topSolution?.text
      ? `The strongest common direction is to ${topSolution.text.replace(/[.?!]+$/, '').replace(/^\s+/,'').toLowerCase()}.`
      : 'Common solution is still forming.',
    source: 'fallback',
  };
};

const extractOpenAiOutputText = (data) => {
  return data?.choices?.[0]?.message?.content || data?.output_text || '';
};

const parseOpenAiSolutionSummary = (data) => {
  if (data?.output_parsed && typeof data.output_parsed === 'object') {
    return data.output_parsed;
  }

  const outputText = extractOpenAiOutputText(data);
  if (!outputText) return null;

  try {
    return JSON.parse(outputText);
  } catch {
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
};

const getSolutionEntriesForSummary = (normalizedPost) => {
  const structuredEntries = flattenDiscussionEntries(normalizedPost.solutionsList)
    .map((entry) => ({
      text: `${entry?.text ?? ''}`.trim(),
      agree_count: Array.isArray(entry?.upvoters) ? entry.upvoters.length : 0,
      disagree_count: Array.isArray(entry?.downvoters) ? entry.downvoters.length : 0,
      reply_count: Array.isArray(entry?.replies) ? entry.replies.length : 0,
      score: typeof entry?.score === 'number'
        ? entry.score
        : (Array.isArray(entry?.upvoters) ? entry.upvoters.length : 0) - (Array.isArray(entry?.downvoters) ? entry.downvoters.length : 0),
    }))
    .filter((entry) => entry.text);

  if (structuredEntries.length > 0) {
    return structuredEntries;
  }

  return (Array.isArray(normalizedPost?.fixes) ? normalizedPost.fixes : [])
    .map((fix) => `${fix ?? ''}`.trim())
    .filter((fix) => fix && fix.toLowerCase() !== 'awaiting suggested fixes')
    .map((fix) => ({
      text: fix,
      agree_count: 0,
      disagree_count: 0,
      reply_count: 0,
      score: 0,
    }));
};

const createAiSolutionSummary = async (post) => {
  const normalizedPost = normalizePost(post);
  const solutionEntries = getSolutionEntriesForSummary(normalizedPost);

  if (solutionEntries.length === 0) {
    return {
      most_agreed: 'No strong solution has emerged yet.',
      common_solution: 'Common solution is still forming.',
      source: 'empty',
    };
  }

  const fallbackSummary = buildFallbackSolutionSummary(solutionEntries);
  if (!OPENAI_API_KEY) {
    return fallbackSummary;
  }

  const prompt = [
    'You are summarizing civic problem-solving suggestions from users.',
    'Paraphrase the most agreed solution so it sounds polished, concise, and actionable.',
    'Also synthesize the repeated ideas across all user solutions into one clean sentence.',
    'Do not mention votes, comments, or that this is AI-generated.',
    'Keep each field under 35 words.',
    '',
    `Post title: ${normalizedPost.title}`,
    `Location: ${normalizedPost.location}`,
    `Department: ${normalizedPost.department}`,
    '',
    'Solutions:',
    JSON.stringify(solutionEntries, null, 2),
  ].join('\n');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a civic engagement assistant summarizing community solutions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 250,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `OpenAI request failed with status ${response.status}`);
    }

    const parsed = parseOpenAiSolutionSummary(data);
    if (!parsed) {
      throw new Error('OpenAI returned an unreadable summary payload');
    }

    return {
      most_agreed: `${parsed?.most_agreed ?? ''}`.trim() || fallbackSummary.most_agreed,
      common_solution: `${parsed?.common_solution ?? ''}`.trim() || fallbackSummary.common_solution,
      source: 'openai',
    };
  } catch (error) {
    console.error('Falling back to local solution summary:', error);
    return fallbackSummary;
  }
};

// --- Auth Routes ---

app.get('/api/auth/username-availability', async (req, res) => {
  try {
    const { normalizedUsername, error } = validateRequestedUsername(req.query.username);
    if (error) {
      return res.json({
        available: false,
        normalizedUsername,
        reason: error,
      });
    }

    const existingUser = await findUserByNormalizedUsername(normalizedUsername);
    res.json({
      available: !existingUser,
      normalizedUsername,
      reason: existingUser ? 'That username is already taken.' : '',
    });
  } catch (error) {
    console.error('Error checking username availability:', error);
    res.status(500).json({ available: false, normalizedUsername: '', reason: 'Failed to check username.' });
  }
});

/*
// --- Legacy Auth Routes (Deprecated in favor of Firebase) ---
app.post('/api/auth/signup', async (req, res) => {
  // ... (Legacy code)
});

app.post('/api/auth/login', async (req, res) => {
  // ... (Legacy code)
});
*/

app.post('/api/auth/firebaseLogin', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  if (admin.apps.length === 0) {
    console.error('Firebase Login error: Firebase Admin SDK not initialized.');
    return res.status(500).json({ error: 'Server configuration error: Firebase not initialized.' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const normalizedUid = decoded.uid;
    
    const { gender, username, mode, displayName, email, phoneNumber } = req.body;
    const identityError = validateSubmittedFirebaseIdentity(decoded, { email, phoneNumber });
    if (identityError) {
      return res.status(400).json({ error: identityError });
    }
    
    const finalEmail = normalizeEmail(decoded.email);
    const finalDisplayName = normalizeDisplayName(displayName || decoded.name || decoded.display_name);
    const finalPhoneNumber = getTrustedFirebasePhoneNumber(decoded);
    const normalizedGender = normalizeGender(gender);
    const normalizedMode = `${mode ?? 'login'}`.trim().toLowerCase() === 'signup' ? 'signup' : 'login';
    const requestedUsername = normalizeUsernameCandidate(username);
    const { normalizedUsername, error: usernameError } = requestedUsername
      ? validateRequestedUsername(username)
      : { normalizedUsername: '', error: '' };
    
    const hasValidEmail = finalEmail && finalEmail.includes('@');
    const hasVerifiedEmail = Boolean(getVerifiedFirebaseEmail(decoded));
    const hasPhone = !!finalPhoneNumber;
    const usernameSeed = finalDisplayName || (hasValidEmail ? finalEmail.split('@')[0] : '') || finalPhoneNumber || normalizedUid;

    if (normalizedMode === 'signup' && requestedUsername && usernameError) {
      return res.status(400).json({ error: usernameError });
    }

    let { data: user } = await supabase.from('users').select('*').eq('firebase_uid', normalizedUid).single();
    
    if (!user && hasVerifiedEmail) {
      const { data } = await supabase.from('users').select('*').eq('email', finalEmail).single();
      user = data;
    }

    if (!user && hasPhone) {
      const { data } = await supabase.from('users').select('*').eq('phone_number', finalPhoneNumber).single();
      user = data;
    }

    if (!user) {
      if (normalizedMode !== 'signup') {
        return res.status(404).json({ error: 'Account not found. Please sign up first.' });
      }

      const resolvedUsername = requestedUsername
        ? normalizedUsername
        : await generateUniqueUsername(usernameSeed, normalizedUid);

      if (requestedUsername) {
        const existingUsernameOwner = await findUserByNormalizedUsername(resolvedUsername);
        if (existingUsernameOwner) {
          return res.status(409).json({ error: 'That username is already taken.' });
        }
      }

      const { data: newUser, error } = await supabase.from('users').insert({
        username: resolvedUsername,
        display_name: finalDisplayName,
        firebase_uid: normalizedUid,
        email: hasValidEmail ? finalEmail : null,
        gender: normalizedGender,
        phone_number: hasPhone ? finalPhoneNumber : null,
        role: 'CitizenReporter',
        password_hash: 'firebase_oauth'
      }).select().single();
      
      if (error) throw error;
      user = newUser;
    } else {
      if (user.firebase_uid && user.firebase_uid !== normalizedUid) {
        return res.status(409).json({ error: 'This account is already linked to another login.' });
      }

      const updateData = {};
      if (!user.firebase_uid) updateData.firebase_uid = normalizedUid;

      if (hasVerifiedEmail && (!user.email || user.email !== finalEmail)) {
        const { data: emailOwner } = await supabase.from('users').select('*').eq('email', finalEmail).neq('id', user.id).single();
        if (!emailOwner) updateData.email = finalEmail;
      }

      if (hasPhone && (user.phone_number || user.phoneNumber) !== finalPhoneNumber) {
        const { data: phoneOwner } = await supabase.from('users').select('*').eq('phone_number', finalPhoneNumber).neq('id', user.id).single();
        if (!phoneOwner) updateData.phone_number = finalPhoneNumber;
      }
      
      if (normalizedGender && !user.gender) updateData.gender = normalizedGender;
      if (finalDisplayName && !(user.display_name || user.displayName)) updateData.display_name = finalDisplayName;

      if (Object.keys(updateData).length > 0) {
        const { data: updatedUser, error } = await supabase.from('users').update(updateData).eq('id', user.id).select().single();
        if (error) throw error;
        user = updatedUser;
      }
    }
    
    res.json({
      token: token, // Return the same token or just user info
      username: user.username,
      role: user.role,
      uid: user.firebase_uid || '',
    });
  } catch (error) {
    console.error('Firebase Login error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- User Profile Routes ---

app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    res.json(await buildProfilePayload(user, req.user.username, { includePrivateFields: true }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.patch('/api/users/profile/gender', authenticateToken, async (req, res) => {
  try {
    const normalizedGender = normalizeGender(req.body?.gender);
    if (!normalizedGender) {
      return res.status(400).json({ error: 'Choose a gender option to continue.' });
    }

    const { data: user, error } = await supabase.from('users').update({ gender: normalizedGender }).eq('id', req.user.id).select().single();
    if (error || !user) return res.status(404).json({ error: 'Profile not found' });

    res.json({ gender: user.gender });
  } catch (error) {
    console.error('Error updating profile gender:', error);
    res.status(500).json({ error: 'Failed to update profile gender' });
  }
});

app.get('/api/users/:username', attachOptionalUser, async (req, res) => {
  try {
    const targetUsername = `${req.params.username ?? ''}`.trim();
    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });

    const { data: user } = await supabase.from('users').select('*').eq('username', targetUsername).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const payload = await buildProfilePayload(user, req.user?.username || '');
    const viewerFollowing = req.user
      ? getUniqueStrings((await supabase.from('users').select('following').eq('id', req.user.id).single()).data?.following)
      : [];

    res.json({
      ...payload,
      isFollowing: !!req.user?.username && viewerFollowing.includes(targetUsername),
    });
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

app.get('/api/users/:username/connections', attachOptionalUser, async (req, res) => {
  try {
    const targetUsername = `${req.params.username ?? ''}`.trim();
    const connectionType = `${req.query.type ?? ''}`.trim().toLowerCase();

    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });
    if (!['followers', 'following'].includes(connectionType)) {
      return res.status(400).json({ error: 'Connection type must be followers or following' });
    }

    const { data: targetUser } = await supabase.from('users').select('username, following').eq('username', targetUsername).single();
    if (!targetUser) return res.status(404).json({ error: 'Profile not found' });

    const viewerFollowing = req.user
      ? getUniqueStrings((await supabase.from('users').select('following').eq('id', req.user.id).single()).data?.following)
      : [];

    let connectionUsers = [];

    if (connectionType === 'following') {
      const followingUsernames = getUniqueStrings(targetUser.following);
      if (followingUsernames.length > 0) {
        const { data: followingUsers } = await supabase.from('users').select('username, role, profile_photo_url, display_name').in('username', followingUsernames);
        const userByUsername = new Map(
          followingUsers.map((u) => [u.username, u]),
        );
        connectionUsers = followingUsernames
          .map((username) => userByUsername.get(username))
          .filter(Boolean);
      }
    } else {
      const { data: followers } = await supabase.from('users').select('username, role, profile_photo_url, display_name').contains('following', [targetUsername]);
      connectionUsers = followers || [];
      connectionUsers.sort((firstUser, secondUser) => firstUser.username.localeCompare(secondUser.username));
    }

    res.json({
      username: targetUsername,
      type: connectionType,
      connections: connectionUsers.map((user) => (
        buildConnectionListEntry(user, viewerFollowing, req.user?.username || '')
      )),
    });
  } catch (error) {
    console.error('Error fetching user connections:', error);
    res.status(500).json({ error: 'Failed to fetch user connections' });
  }
});

app.post('/api/users/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Photo is required' });

    const photoValidation = await ensureUploadedImageFile(req.file);
    if (!photoValidation.ok) return res.status(415).json({ error: photoValidation.error });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const nextPhotoUrl = `/uploads/${req.file.filename}`;
    const previousPhotoUrl = user.profile_photo_url || user.profilePhotoUrl;
    
    const { error } = await supabase.from('users').update({ profile_photo_url: nextPhotoUrl }).eq('id', req.user.id);
    if (error) throw error;

    await uploadFileToStorage(req.file.filename, path.resolve(UPLOADS_DIR, req.file.filename), req.file.mimetype);

    if (previousPhotoUrl && previousPhotoUrl !== nextPhotoUrl) {
      try {
        await deleteFileIfExists(path.resolve(UPLOADS_DIR, path.basename(previousPhotoUrl)));
        await deleteFromStorage(path.basename(previousPhotoUrl));
      } catch (error) {
        console.error(`Failed to delete old profile photo ${previousPhotoUrl}:`, error.message);
      }
    }

    res.json({ profilePhotoUrl: nextPhotoUrl });
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

app.delete('/api/users/profile/photo', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const previousPhotoUrl = user.profile_photo_url || user.profilePhotoUrl;
    const { error } = await supabase.from('users').update({ profile_photo_url: null }).eq('id', req.user.id);
    if (error) throw error;

    if (previousPhotoUrl) {
      try {
        await deleteFileIfExists(path.resolve(UPLOADS_DIR, path.basename(previousPhotoUrl)));
      } catch (deleteError) {
        console.error(`Failed to delete profile photo ${previousPhotoUrl}:`, deleteError.message);
      }
    }

    res.json({ profilePhotoUrl: '' });
  } catch (error) {
    console.error('Error removing profile photo:', error);
    res.status(500).json({ error: 'Failed to remove profile photo' });
  }
});

app.post('/api/users/profile/banner', authenticateToken, upload.single('banner'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Banner is required' });

    const bannerValidation = await ensureUploadedImageFile(req.file);
    if (!bannerValidation.ok) return res.status(415).json({ error: bannerValidation.error });

    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const nextBannerUrl = `/uploads/${req.file.filename}`;
    const previousBannerUrl = await getUserBannerUrl(user);

    try {
      await updateUserMediaColumn(req.user.id, 'banner_url', 'bannerUrl', nextBannerUrl);
    } catch (error) {
      if (!isMissingColumnError(error, 'banner_url') && !isMissingColumnError(error, 'bannerUrl')) {
        throw error;
      }
      await writeUserMediaOverride(user, { bannerUrl: nextBannerUrl });
    }

    await uploadFileToStorage(req.file.filename, path.resolve(UPLOADS_DIR, req.file.filename), req.file.mimetype);

    if (previousBannerUrl && previousBannerUrl !== nextBannerUrl) {
      try {
        await deleteFileIfExists(path.resolve(UPLOADS_DIR, path.basename(previousBannerUrl)));
        await deleteFromStorage(path.basename(previousBannerUrl));
      } catch (error) {
        console.error(`Failed to delete old banner ${previousBannerUrl}:`, error.message);
      }
    }

    res.json({ bannerUrl: nextBannerUrl });
  } catch (error) {
    console.error('Error uploading banner:', error);
    res.status(500).json({ error: 'Failed to upload banner' });
  }
});

app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const updates = req.body && typeof req.body === 'object' ? req.body : {};
    const hasDisplayNameUpdate = Object.prototype.hasOwnProperty.call(updates, 'displayName');
    const hasUsernameUpdate = Object.prototype.hasOwnProperty.call(updates, 'username');
    const hasPersonalDescriptionUpdate = Object.prototype.hasOwnProperty.call(updates, 'personalDescription');

    if (!hasDisplayNameUpdate && !hasUsernameUpdate && !hasPersonalDescriptionUpdate) {
      return res.status(400).json({ error: 'At least one field (displayName, username, personalDescription) is required.' });
    }

    const updateData = {};
    const currentUsername = user.username;

    if (hasUsernameUpdate) {
      const { normalizedUsername, error: usernameError } = validateRequestedUsername(updates.username);
      if (usernameError) return res.status(400).json({ error: usernameError });

      if (normalizedUsername !== currentUsername) {
        const existingUser = await findUserByNormalizedUsername(normalizedUsername);
        if (existingUser) return res.status(409).json({ error: 'That username is already taken.' });
        updateData.username = normalizedUsername;
      }
    }

    if (hasDisplayNameUpdate) {
      updateData.display_name = normalizeDisplayName(updates.displayName);
    }

    if (hasPersonalDescriptionUpdate) {
      updateData.personal_description = normalizePersonalDescription(updates.personalDescription);
    }

    let updatedUser = user;

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase.from('users').update(updateData).eq('id', user.id).select().single();
      if (error) throw error;
      updatedUser = data;
      
      if (updateData.username) {
        try {
          await renameUserReferences(currentUsername, updateData.username);
        } catch (renameError) {
          await supabase.from('users').update({ username: currentUsername }).eq('id', user.id);
          throw renameError;
        }
      }
    }

    res.json({
      profile: await buildProfilePayload(updatedUser, updatedUser.username, { includePrivateFields: true }),
    });
  } catch (error) {
    console.error('Error updating profile details:', error);
    res.status(500).json({ error: 'Failed to update profile details' });
  }
});

app.patch('/api/users/profile/password', authenticateToken, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    if (!user.password_hash || user.password_hash === 'firebase_oauth') {
      return res.status(400).json({ error: 'Password changes are only available for email and password accounts.' });
    }

    const currentPassword = `${req.body?.currentPassword ?? ''}`;
    const nextPassword = `${req.body?.newPassword ?? ''}`;

    if (!currentPassword) return res.status(400).json({ error: 'Current password is required.' });
    if (nextPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newPasswordHash = await bcrypt.hash(nextPassword, 12);
    await supabase.from('users').update({ password_hash: newPasswordHash }).eq('id', req.user.id);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/users/:username/follow', authenticateToken, async (req, res) => {
  try {
    const targetUsername = `${req.params.username ?? ''}`.trim();
    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });
    if (targetUsername === req.user.username) return res.status(400).json({ error: 'You cannot follow yourself' });

    const [
      { data: viewer },
      { data: targetUser }
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', req.user.id).single(),
      supabase.from('users').select('*').ilike('username', targetUsername).single(),
    ]);

    if (!viewer) return res.status(404).json({ error: 'Profile not found' });
    if (!targetUser) return res.status(404).json({ error: 'Target profile not found' });

    const actualTargetUser = targetUser.username;
    if (actualTargetUser === req.user.username) return res.status(400).json({ error: 'You cannot follow yourself' });

    const following = getUniqueStrings(viewer.following);
    const isFollowing = following.includes(actualTargetUser);
    const nextFollowing = isFollowing
      ? following.filter((username) => username !== actualTargetUser)
      : [...following, actualTargetUser];

    await supabase.from('users').update({ following: nextFollowing }).eq('id', viewer.id);

    if (!isFollowing) {
      await createNotification({
        recipientUsername: actualTargetUser,
        actorUsername: viewer.username,
        type: 'follow',
        message: `${viewer.username} started following you.`,
      });
    }

    const { count: followerCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).contains('following', [actualTargetUser]);
    
    res.json({
      following: nextFollowing,
      targetUsername: actualTargetUser,
      isFollowing: !isFollowing,
      followerCount: followerCount || 0,
      followingCount: getUniqueStrings(targetUser.following).length,
    });
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to update follow state' });
  }
});

app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const viewerUsername = `${req.user?.username ?? ''}`.trim();
    if (!viewerUsername) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch all messages involving the viewer
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_username.eq.${viewerUsername},recipient_username.eq.${viewerUsername}`)
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    const unreadCounts = messages.reduce((counts, message) => {
      const senderUsername = `${message.sender_username ?? ''}`.trim();
      const recipientUsername = `${message.recipient_username ?? ''}`.trim();

      if (recipientUsername !== viewerUsername || message.read || !senderUsername) return counts;
      counts[senderUsername] = (counts[senderUsername] ?? 0) + 1;
      return counts;
    }, {});

    const latestMessageByUsername = new Map();
    const counterpartLabelByUsername = new Map();
    messages.forEach((message) => {
      const senderUsername = `${message.sender_username ?? ''}`.trim();
      const recipientUsername = `${message.recipient_username ?? ''}`.trim();
      const counterpartUsername = senderUsername === viewerUsername ? recipientUsername : senderUsername;

      if (!counterpartUsername || latestMessageByUsername.has(counterpartUsername)) return;

      latestMessageByUsername.set(counterpartUsername, message);
      counterpartLabelByUsername.set(counterpartUsername, counterpartUsername);
    });

    const counterpartUsernames = [...latestMessageByUsername.keys()];
    const { data: counterpartUsers } = counterpartUsernames.length > 0
      ? await supabase.from('users').select('username, display_name, role, profile_photo_url').in('username', counterpartUsernames)
      : { data: [] };
    
    const userByUsername = new Map(counterpartUsers.map((user) => [user.username, user]));

    const threads = counterpartUsernames.map((username) => {
      const user = userByUsername.get(username) ?? {};
      const fallbackUsername = `${counterpartLabelByUsername.get(username) ?? ''}`.trim();
      return {
        username: `${user?.username ?? fallbackUsername}`.trim(),
        displayName: `${user?.display_name || user?.displayName || fallbackUsername}`.trim(),
        role: `${user?.role ?? 'CitizenReporter'}`.trim() || 'CitizenReporter',
        profilePhotoUrl: `${user?.profile_photo_url || user?.profilePhotoUrl || ''}`.trim(),
        unreadCount: unreadCounts[username] ?? 0,
        lastMessage: serializeMessage(latestMessageByUsername.get(username), viewerUsername),
      };
    }).filter((thread) => thread.username);

    res.json({ threads });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/chats/:username/messages', authenticateToken, async (req, res) => {
  try {
    const viewerUsername = `${req.user?.username ?? ''}`.trim();
    const targetUsername = `${req.params.username ?? ''}`.trim();
    if (!viewerUsername) return res.status(401).json({ error: 'Unauthorized' });
    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });
    if (targetUsername === viewerUsername) return res.status(400).json({ error: 'Cannot open a private chat with yourself' });

    const { data: targetUser } = await supabase.from('users').select('username, display_name, role, profile_photo_url').ilike('username', targetUsername).single();
    if (!targetUser) return res.status(404).json({ error: 'Profile not found' });

    const actualTargetUser = targetUser.username;

    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_username.eq.${viewerUsername},recipient_username.eq.${actualTargetUser}),and(sender_username.eq.${actualTargetUser},recipient_username.eq.${viewerUsername})`)
      .order('created_at', { ascending: true });

    await supabase.from('messages').update({ read: true }).eq('sender_username', actualTargetUser).eq('recipient_username', viewerUsername).eq('read', false);

    res.json({
      thread: {
        username: targetUser.username,
        displayName: `${targetUser.display_name || targetUser.displayName || ''}`.trim(),
        role: `${targetUser.role ?? 'CitizenReporter'}`.trim() || 'CitizenReporter',
        profilePhotoUrl: `${targetUser.profile_photo_url || targetUser.profilePhotoUrl || ''}`.trim(),
      },
      messages: (messages || []).map((message) => serializeMessage(message, viewerUsername)),
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

app.post('/api/chats/:username/messages', authenticateToken, async (req, res) => {
  try {
    const viewerUsername = `${req.user?.username ?? ''}`.trim();
    const targetUsername = `${req.params.username ?? ''}`.trim();
    const text = `${req.body?.text ?? ''}`.trim();

    if (!viewerUsername) return res.status(401).json({ error: 'Unauthorized' });
    if (!targetUsername) return res.status(400).json({ error: 'Username is required' });
    if (targetUsername === viewerUsername) return res.status(400).json({ error: 'Cannot send a private message to yourself' });
    if (!text) return res.status(400).json({ error: 'Message text is required' });
    if (text.length > 2000) return res.status(400).json({ error: 'Message is too long' });

    const { data: targetUser } = await supabase.from('users').select('username').ilike('username', targetUsername).single();
    if (!targetUser) return res.status(404).json({ error: 'Profile not found' });

    const actualTargetUser = targetUser.username;

    const { data: message, error } = await supabase.from('messages').insert({
      sender_username: viewerUsername,
      recipient_username: actualTargetUser,
      participants: buildParticipants(viewerUsername, actualTargetUser),
      text,
      read: false,
    }).select().single();

    if (error) throw error;

    await createNotification({
      recipientUsername: actualTargetUser,
      actorUsername: viewerUsername,
      type: 'chat_message',
      message: `${viewerUsername} reached out privately.`,
    });

    res.status(201).json({ message: serializeMessage(message, viewerUsername) });
  } catch (error) {
    console.error('Error sending private chat message:', error);
    res.status(500).json({ error: 'Failed to send private chat message' });
  }
});

// --- Content Routes ---

app.get('/api/posts', async (req, res) => {
  try {
    const { data: posts, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json((posts || []).map(normalizePost));
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/api/posts/:postId/ai-summary', async (req, res) => {
  try {
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const normalizedPost = normalizePost(post);
    const cacheKey = buildAiSummaryCacheKey(normalizedPost);
    const cachedSummary = getCachedAiSummary(cacheKey);
    if (cachedSummary) {
      return res.json(cachedSummary);
    }

    if (OPENAI_API_KEY && !consumeAiSummaryRateLimit(req)) {
      return res.status(429).json({ error: 'Too many AI summary requests. Please try again soon.' });
    }

    const summary = await createAiSolutionSummary(normalizedPost);
    aiSummaryCache.set(cacheKey, {
      data: summary,
      expiresAt: Date.now() + AI_SUMMARY_CACHE_TTL_MS,
    });
    res.json(summary);
  } catch (error) {
    console.error('Error generating AI solution summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary' });
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

    // Mirror every uploaded file (originals + transcoded video variants) to
    // Supabase Storage so media is served from the uploads bucket.
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(async (file) => {
        await uploadFileToStorage(file.filename, path.resolve(UPLOADS_DIR, file.filename), file.mimetype);
        if (file.mimetype.startsWith('video/')) {
          const parsed = path.parse(file.filename);
          for (const preset of VIDEO_QUALITY_PRESETS) {
            const variantPath = path.resolve(UPLOADS_DIR, `${parsed.name}-${preset.label}.mp4`);
            if (fs.existsSync(variantPath)) {
              await uploadFileToStorage(`${parsed.name}-${preset.label}.mp4`, variantPath, 'video/mp4');
            }
          }
        }
      }));
    }
  }

  try {
    const { data: newPost, error } = await supabase.from('posts').insert({
      id,
      location: location || 'India',
      department: department || 'General',
      title,
      description,
      author,
      created_at: new Date(),
      media: media || 'IMAGE',
      tag: department || 'Issue',
      accent: 'from-slate-900 via-slate-800 to-slate-700',
      fixes,
      media_list: mediaList
    }).select().single();
    
    if (error) throw error;

    broadcastPostUpdate(newPost, 'created');
    res.status(201).json(normalizePost(newPost));
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

app.delete('/api/posts/:postId', authenticateToken, async (req, res) => {
  try {
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.author !== req.user.username) {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }

    const mediaFilePaths = collectPostMediaFilePaths(normalizePost(post));
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) throw error;

    await Promise.all(
      mediaFilePaths.map(async (mediaFilePath) => {
        try {
          await deleteFileIfExists(mediaFilePath);
          await deleteFromStorage(path.basename(mediaFilePath));
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
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const supporters = Array.isArray(post.supporters) ? post.supporters : [];
    const username = req.user.username;
    const existingIndex = supporters.indexOf(username);

    const addedSupport = existingIndex < 0;
    const nextSupporters = addedSupport
      ? [...supporters, username]
      : supporters.filter((u) => u !== username);

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        supporters: nextSupporters,
        support: nextSupporters.length
      })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    if (addedSupport) {
      await createNotification({
        recipientUsername: post.author,
        actorUsername: req.user.username,
        type: 'support',
        postId: post.id,
        postTitle: post.title,
        message: `${req.user.username} supported your report "${post.title}".`,
      });
    }
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
  } catch (error) {
    console.error('Error updating support:', error);
    res.status(500).json({ error: 'Failed to update support' });
  }
});

app.post('/api/posts/:postId/bookmark', authenticateToken, async (req, res) => {
  try {
    const { data: post } = await supabase.from('posts').select('id').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const { data: user } = await supabase.from('users').select('id, bookmarked_post_ids').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const bookmarkedPostIds = getUniqueStrings(user.bookmarked_post_ids || user.bookmarkedPostIds);
    const isBookmarked = bookmarkedPostIds.includes(post.id);
    const nextBookmarks = isBookmarked
      ? bookmarkedPostIds.filter((postId) => postId !== post.id)
      : [post.id, ...bookmarkedPostIds];

    const { error } = await supabase.from('users').update({ bookmarked_post_ids: nextBookmarks }).eq('id', user.id);
    if (error) throw error;

    res.json({
      bookmarkedPostIds: nextBookmarks,
      saved: !isBookmarked,
      postId: post.id,
    });
  } catch (error) {
    console.error('Error updating bookmarks:', error);
    res.status(500).json({ error: 'Failed to update bookmarks' });
  }
});

app.post('/api/posts/:postId/report', authenticateToken, async (req, res) => {
  try {
    const { data: post } = await supabase.from('posts').select('id, author').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author === req.user.username) {
      return res.status(400).json({ error: 'You cannot report your own post' });
    }

    const { data: user } = await supabase.from('users').select('id, reported_post_ids').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    const reportedPostIds = getUniqueStrings(user.reported_post_ids || user.reportedPostIds);
    const alreadyReported = reportedPostIds.includes(post.id);
    let nextReports = reportedPostIds;

    if (!alreadyReported) {
      nextReports = [post.id, ...reportedPostIds];
      await supabase.from('users').update({ reported_post_ids: nextReports }).eq('id', user.id);
    }

    res.json({
      postId: post.id,
      reported: true,
      alreadyReported,
      reportedPostIds: nextReports,
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    res.status(500).json({ error: 'Failed to report post' });
  }
});

app.post('/api/posts/:postId/comments', authenticateToken, async (req, res) => {
  const text = `${req.body?.text ?? ''}`.trim();
  if (!text) return res.status(400).json({ error: 'Comment text is required' });

  try {
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const commentsList = Array.isArray(post.comments_list || post.commentsList) ? (post.comments_list || post.commentsList) : [];
    const newComment = {
      author: req.user.username,
      text,
      createdAt: new Date(),
    };
    const nextComments = [...commentsList, newComment];

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        comments_list: nextComments,
        comments: nextComments.length
      })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      recipientUsername: post.author,
      actorUsername: req.user.username,
      type: 'comment',
      postId: post.id,
      postTitle: post.title,
      message: `${req.user.username} commented on your report "${post.title}".`,
    });
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.post('/api/posts/:postId/solutions', authenticateToken, async (req, res) => {
  const text = `${req.body?.text ?? ''}`.trim();
  if (!text) return res.status(400).json({ error: 'Solution text is required' });

  try {
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const solutionsList = Array.isArray(post.solutions_list || post.solutionsList) ? (post.solutions_list || post.solutionsList) : [];
    const newSolution = {
      author: req.user.username,
      text,
      createdAt: new Date(),
      upvoters: [],
      downvoters: [],
      replies: [],
    };
    const nextSolutions = [...solutionsList, newSolution];

    const currentFixes = Array.isArray(post.fixes) ? post.fixes : [];
    let nextFixes = [...currentFixes];
    if (!nextFixes.includes(text)) nextFixes.unshift(text);
    nextFixes = nextFixes.slice(0, 8);

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        solutions_list: nextSolutions,
        solutions: nextSolutions.length,
        fixes: nextFixes
      })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      recipientUsername: post.author,
      actorUsername: req.user.username,
      type: 'solution',
      postId: post.id,
      postTitle: post.title,
      message: `${req.user.username} proposed a solution on your report "${post.title}".`,
    });
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
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
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const solutionsList = Array.isArray(post.solutions_list || post.solutionsList) ? (post.solutions_list || post.solutionsList) : [];
    const solution = solutionsList[solutionIndex];
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    
    const targetEntry = ensureWritableDiscussionTarget(solution, targetPath);
    if (!targetEntry) return res.status(404).json({ error: 'Reply not found' });

    const username = req.user.username;
    const hadUpvote = Array.isArray(targetEntry.upvoters) && targetEntry.upvoters.includes(username);
    const hadDownvote = Array.isArray(targetEntry.downvoters) && targetEntry.downvoters.includes(username);
    targetEntry.upvoters = (targetEntry.upvoters || []).filter((value) => value !== username);
    targetEntry.downvoters = (targetEntry.downvoters || []).filter((value) => value !== username);

    if (voteType === 'up' && !hadUpvote) {
      targetEntry.upvoters.push(username);
    }
    if (voteType === 'down' && !hadDownvote) {
      targetEntry.downvoters.push(username);
    }
    const createdUpvote = voteType === 'up' && !hadUpvote;
    const createdDownvote = voteType === 'down' && !hadDownvote;

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({ solutions_list: solutionsList })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    if (createdUpvote || createdDownvote) {
      const targetLabel = targetPath.length > 0 ? 'reply' : 'solution';
      await createNotification({
        recipientUsername: targetEntry.author,
        actorUsername: req.user.username,
        type: createdUpvote ? 'solution_upvote' : 'solution_downvote',
        postId: post.id,
        postTitle: post.title,
        message: createdUpvote
          ? `${req.user.username} agreed with your ${targetLabel} on "${post.title}".`
          : `${req.user.username} disagreed with your ${targetLabel} on "${post.title}".`,
      });
    }
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
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
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const solutionsList = Array.isArray(post.solutions_list || post.solutionsList) ? (post.solutions_list || post.solutionsList) : [];
    const solution = solutionsList[solutionIndex];
    if (!solution) return res.status(404).json({ error: 'Solution not found' });
    
    const parentEntry = ensureWritableDiscussionTarget(solution, parentPath);
    if (!parentEntry) return res.status(404).json({ error: 'Reply target not found' });

    if (!Array.isArray(parentEntry.replies)) parentEntry.replies = [];
    parentEntry.replies.push(createDiscussionEntry(req.user.username, text));

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({ solutions_list: solutionsList })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    const targetLabel = parentPath.length > 0 ? 'reply' : 'solution';
    await createNotification({
      recipientUsername: parentEntry.author,
      actorUsername: req.user.username,
      type: 'solution_reply',
      postId: post.id,
      postTitle: post.title,
      message: `${req.user.username} replied to your ${targetLabel} on "${post.title}".`,
    });
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
  } catch (error) {
    console.error('Error replying to solution:', error);
    res.status(500).json({ error: 'Failed to add solution reply' });
  }
});

app.post('/api/posts/:postId/share', attachOptionalUser, async (req, res) => {
  try {
    const { data: post } = await supabase.from('posts').select('*').eq('id', req.params.postId).single();
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const nextShares = (toCount(post.shares) || 0) + 1;
    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({ shares: nextShares })
      .eq('id', post.id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      recipientUsername: post.author,
      actorUsername: req.user?.username || '',
      type: 'share',
      postId: post.id,
      postTitle: post.title,
      message: req.user?.username
        ? `${req.user.username} shared your report "${post.title}".`
        : `Someone shared your report "${post.title}".`,
    });
    broadcastPostUpdate(updatedPost);
    res.json(normalizePost(updatedPost));
  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({ error: 'Failed to update share' });
  }
});

app.get('/api/cities', async (req, res) => {
  try {
    const { data: cities, error } = await supabase.from('cities').select('*').order('issues', { ascending: false });
    if (error) throw error;
    res.json(cities || []);
  } catch {
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/api/notifications', attachOptionalUser, async (req, res) => {
  try {
    const viewerUsername = `${req.user?.username ?? ''}`.trim();
    if (!viewerUsername) {
      return res.json([]);
    }
    
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_username', viewerUsername)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json((notifications || []).map(serializeNotification));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.patch('/api/notifications/read', authenticateToken, async (req, res) => {
  try {
    const viewerUsername = `${req.user?.username ?? ''}`.trim();
    if (!viewerUsername) return res.status(400).json({ error: 'Username is required' });

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_username', viewerUsername)
      .eq('read', false);

    if (error) throw error;

    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `Files must be ${Math.floor(MAX_UPLOAD_FILE_SIZE_BYTES / (1024 * 1024))}MB or smaller.` });
    }

    return res.status(400).json({ error: error.message || 'Upload failed.' });
  }

  if (error?.message === INVALID_UPLOAD_TYPE_ERROR_MESSAGE) {
    return res.status(415).json({ error: error.message });
  }

  return next(error);
});

app.listen(PORT, () => console.log(`Backend server listening at http://localhost:${PORT}`));
