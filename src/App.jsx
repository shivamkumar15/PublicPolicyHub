import { useEffect, useRef, useState } from 'react';
import Activity from 'lucide-react/dist/esm/icons/activity.js';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.js';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right.js';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check.js';
import Bell from 'lucide-react/dist/esm/icons/bell.js';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.js';
import Building2 from 'lucide-react/dist/esm/icons/building-2.js';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down.js';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import Globe from 'lucide-react/dist/esm/icons/globe.js';
import House from 'lucide-react/dist/esm/icons/house.js';
import ImageIcon from 'lucide-react/dist/esm/icons/image.js';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb.js';
import LogOut from 'lucide-react/dist/esm/icons/log-out.js';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2.js';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle.js';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2.js';
import Pause from 'lucide-react/dist/esm/icons/pause.js';
import Play from 'lucide-react/dist/esm/icons/play.js';
import Settings from 'lucide-react/dist/esm/icons/settings.js';
import Share2 from 'lucide-react/dist/esm/icons/share-2.js';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check.js';
import SquarePen from 'lucide-react/dist/esm/icons/square-pen.js';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2.js';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up.js';
import UserCheck from 'lucide-react/dist/esm/icons/user-check.js';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus.js';
import Users from 'lucide-react/dist/esm/icons/users.js';
import VideoIcon from 'lucide-react/dist/esm/icons/video.js';
import Volume2 from 'lucide-react/dist/esm/icons/volume-2.js';
import VolumeX from 'lucide-react/dist/esm/icons/volume-x.js';
import X from 'lucide-react/dist/esm/icons/x.js';
import Zap from 'lucide-react/dist/esm/icons/zap.js';

import AuthPage from './AuthPage.jsx';
import {
  auth,
  createUserWithEmailAndPassword,
  provider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from './firebase.js';

const Logo = new URL('../Logo.svg', import.meta.url).href;
const API_BASE_URL = '';

const navItems = [
  { id: 'home', label: 'Home', Icon: (props) => <House {...props} /> },
  { id: 'create', label: 'Report', Icon: (props) => <SquarePen {...props} />, requiresAuth: true },
  { id: 'bookmarks', label: 'Bookmarks', Icon: (props) => <Bookmark {...props} />, requiresAuth: true },
  { id: 'alerts', label: 'Alerts', Icon: (props) => <Bell {...props} /> },
];

const defaultPosts = [
  {
    id: 'patna',
    location: 'Patna, Bihar',
    department: 'Traffic Police',
    title: 'Police asking bribe at checkpoint',
    description: 'Driver forced to pay Rs 500 to pass. Timestamped clip, route details, and prior complaint references are attached.',
    author: 'CitizenReporter',
    time: '3h ago',
    support: 2400,
    comments: 342,
    solutions: 45,
    shares: 12,
    media: 'VIDEO',
    verified: true,
    nearby: true,
    tag: 'Corruption',
    accent: 'from-slate-950 via-blue-700 to-orange-500',
    fixes: ['Introduce body cameras.', 'QR complaint receipts.', 'Daily supervisor audit.'],
  },
  {
    id: 'bengaluru',
    location: 'Bengaluru, Karnataka',
    department: 'Transport',
    title: '43 dead bus windows mapped on ORR',
    description: 'Commuters turned route gaps into a social-first thread with stop names, peak-time clips, and delay patterns.',
    author: 'MetroLens',
    time: '5h ago',
    support: 1900,
    comments: 228,
    solutions: 31,
    shares: 8,
    media: 'VIDEO',
    verified: true,
    nearby: false,
    tag: 'Infrastructure',
    accent: 'from-blue-950 via-blue-600 to-cyan-400',
    fixes: ['Live spacing dashboard.', 'Depot shortage disclosure.', 'Commuter escalation channel.'],
  },
  {
    id: 'lucknow',
    location: 'Lucknow, Uttar Pradesh',
    department: 'Education',
    title: 'School lab equipment missing after procurement',
    description: 'Students compared records against classroom photos and built a visual audit thread anyone can verify quickly.',
    author: 'CampusWatch',
    time: '7h ago',
    support: 1200,
    comments: 174,
    solutions: 20,
    shares: 4,
    media: 'IMAGE',
    verified: false,
    nearby: true,
    tag: 'Education',
    accent: 'from-emerald-700 via-emerald-500 to-lime-300',
    fixes: ['District inventory portal.', 'Photo proof before payment.', 'Parent grievance hotline.'],
  },
];

const defaultNotifications = [
  'New comment on your Patna checkpoint post',
  'Your solution reached 50 upvotes',
  'Issue verified by community moderators',
];

const THEME_STORAGE_KEY = 'pph-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [activeView, setActiveView] = useState('home');
  const [activePostId, setActivePostId] = useState(null);
  const [apiPosts, setApiPosts] = useState(defaultPosts);
  const [apiNotifications, setApiNotifications] = useState(defaultNotifications);
  const [isLoading, setIsLoading] = useState(true);

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [mediaSlideIndexByPost, setMediaSlideIndexByPost] = useState({});
  const [solutionInputsByPost, setSolutionInputsByPost] = useState({});
  const [solutionReplyInputsByKey, setSolutionReplyInputsByKey] = useState({});
  const [visibleRepliesByKey, setVisibleRepliesByKey] = useState({});
  const [activeReplyComposerByKey, setActiveReplyComposerByKey] = useState({});
  const [expandedDescriptionByPost, setExpandedDescriptionByPost] = useState({});
  const [isActionSubmittingByPost, setIsActionSubmittingByPost] = useState({});
  const [isSolutionActionSubmittingByKey, setIsSolutionActionSubmittingByKey] = useState({});
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileViewUsername, setProfileViewUsername] = useState(null);
  const [viewedProfileMeta, setViewedProfileMeta] = useState(null);
  const [profileTab, setProfileTab] = useState('reports');
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [profileShareFeedback, setProfileShareFeedback] = useState('');
  const [theme, setTheme] = useState(getInitialTheme);
  const profileMenuRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const solutionInputRefs = useRef({});
  const solutionReplyInputRefs = useRef({});
  const mediaScrollerRefs = useRef({});
  const resolvedProfileUsername = profileViewUsername || userProfile?.username || '';

  const [postForm, setPostForm] = useState({ title: '', description: '', location: '', department: 'General', media: 'IMAGE' });
  const [mediaFiles, setMediaFiles] = useState([]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMediaFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setMediaFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleMediaScroll = (postId, event) => {
    const container = event.currentTarget;
    const nextIndex = Math.round(container.scrollLeft / container.clientWidth);
    setMediaSlideIndexByPost((current) => (
      current[postId] === nextIndex ? current : { ...current, [postId]: nextIndex }
    ));
  };

  const setMediaScrollerRef = (postId, element) => {
    if (!postId) return;
    if (element) {
      mediaScrollerRefs.current[postId] = element;
      return;
    }
    delete mediaScrollerRefs.current[postId];
  };

  const scrollMediaByStep = (postId, direction) => {
    const container = mediaScrollerRefs.current[postId];
    if (!container) return;

    const slideCount = container.children?.length ?? 0;
    if (slideCount <= 1) return;

    const currentIndex = mediaSlideIndexByPost[postId] ?? 0;
    const targetIndex = Math.max(0, Math.min(currentIndex + direction, slideCount - 1));
    if (targetIndex === currentIndex) return;

    container.scrollTo({
      left: targetIndex * container.clientWidth,
      behavior: 'smooth',
    });

    setMediaSlideIndexByPost((current) => (
      current[postId] === targetIndex ? current : { ...current, [postId]: targetIndex }
    ));
  };

  const normalizePost = (post) => ({
    ...post,
    support: toCount(post?.support),
    comments: toCount(post?.comments),
    solutions: toCount(post?.solutions),
    shares: toCount(post?.shares),
    supporters: Array.isArray(post?.supporters) ? post.supporters : [],
    commentsList: Array.isArray(post?.commentsList) ? post.commentsList : [],
    solutionsList: Array.isArray(post?.solutionsList)
      ? post.solutionsList.map(normalizeSolutionEntry).filter(Boolean)
      : [],
    fixes: Array.isArray(post?.fixes) ? post.fixes : [],
    mediaList: Array.isArray(post?.mediaList) ? post.mediaList : [],
  });

  const upsertPostInState = (incomingPost) => {
    const normalizedIncoming = normalizePost(incomingPost);
    setApiPosts((currentPosts) => {
      const existingIndex = currentPosts.findIndex((post) => post.id === normalizedIncoming.id);
      if (existingIndex === -1) return [normalizedIncoming, ...currentPosts];

      const nextPosts = [...currentPosts];
      nextPosts[existingIndex] = normalizedIncoming;
      return nextPosts;
    });
  };

  const removePostFromState = (postId) => {
    if (!postId) return;

    setApiPosts((currentPosts) => currentPosts.filter((post) => post.id !== postId));
    setMediaSlideIndexByPost((current) => {
      if (!(postId in current)) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setSolutionInputsByPost((current) => {
      if (!(postId in current)) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setSolutionReplyInputsByKey((current) => {
      const nextEntries = Object.entries(current).filter(([key]) => !key.startsWith(`${postId}:`));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
    setVisibleRepliesByKey((current) => {
      const nextEntries = Object.entries(current).filter(([key]) => !key.startsWith(`${postId}:`));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
    setActiveReplyComposerByKey((current) => {
      const nextEntries = Object.entries(current).filter(([key]) => !key.startsWith(`${postId}:`));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
    setExpandedDescriptionByPost((current) => {
      if (!(postId in current)) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setIsActionSubmittingByPost((current) => {
      if (!(postId in current)) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setIsSolutionActionSubmittingByKey((current) => {
      const nextEntries = Object.entries(current).filter(([key]) => !key.startsWith(`${postId}:`));
      return nextEntries.length === Object.keys(current).length ? current : Object.fromEntries(nextEntries);
    });
  };

  const openAuthPage = () => {
    setAuthError('');
    setProfileViewUsername(null);
    setActiveView('auth');
  };

  const ensureAuthenticated = () => {
    if (token && userProfile) return true;
    openAuthPage();
    return false;
  };

  const fetchPublicData = () => {
    return Promise.all([
      fetch(`${API_BASE_URL}/api/posts`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/notifications`).then(res => res.json())
    ])
    .then(([postsData, notifsData]) => {
      if (Array.isArray(postsData)) {
        const normalizedPosts = postsData.map(normalizePost);
        setApiPosts(normalizedPosts);
      }
      if (Array.isArray(notifsData)) setApiNotifications(notifsData);
    });
  };

  const fetchProfile = (currentToken) => {
    if (!currentToken) {
      setUserProfile(null);
      return Promise.resolve();
    }

    return fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid token');
      return res.json();
    })
    .then((data) => {
      setUserProfile(data);
      setProfilePhotoUrl(data?.profilePhotoUrl || '');
    })
    .catch(() => handleLogout());
  };

  useEffect(() => {
    setIsLoading(true);
    fetchPublicData()
      .then(() => {
        if (!token) {
          setUserProfile(null);
          return Promise.resolve();
        }

        return fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then((res) => {
            if (!res.ok) throw new Error('Invalid token');
            return res.json();
          })
          .then((data) => setUserProfile(data))
          .catch(() => {
            firebaseSignOut(auth).catch(() => {});
            localStorage.removeItem('token');
            setToken(null);
            setUserProfile(null);
          });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    const events = new EventSource(`${API_BASE_URL}/api/events`);

    const onPostUpdate = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type === 'deleted' && payload?.postId) {
          removePostFromState(payload.postId);
          return;
        }
        if (payload?.post) upsertPostInState(payload.post);
      } catch (error) {
        console.error('Failed to parse realtime event:', error);
      }
    };

    events.addEventListener('post_update', onPostUpdate);
    events.onerror = () => {
      // Browser auto-reconnect handles transient backend restarts.
    };

    return () => {
      events.removeEventListener('post_update', onPostUpdate);
      events.close();
    };
  }, []);

  useEffect(() => {
    setProfilePhotoUrl(userProfile?.profilePhotoUrl || '');
  }, [userProfile?.profilePhotoUrl]);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeMenuOnOutsideClick);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    setProfileTab('reports');
    setProfileShareFeedback('');
  }, [profileViewUsername, userProfile?.username]);

  useEffect(() => {
    if (!resolvedProfileUsername) {
      setViewedProfileMeta(null);
      return;
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE_URL}/api/users/${resolvedProfileUsername}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch public profile');
        return res.json();
      })
      .then((data) => setViewedProfileMeta(data))
      .catch(() => setViewedProfileMeta(null));
  }, [resolvedProfileUsername, token]);

  const handleNavClick = (id) => {
    if ((id === 'create' || id === 'bookmarks') && !userProfile && !token) {
      openAuthPage();
    } else {
      setProfileViewUsername(null);
      setActivePostId(null);
      setActiveView(id);
    }
  };

  const handleDepartmentFilterSelect = (department) => {
    if (!department) return;

    setProfileViewUsername(null);
    setActivePostId(null);
    setActiveView('home');
    setSelectedDepartmentFilter((currentDepartment) => (
      currentDepartment === department ? '' : department
    ));
  };

  const clearDepartmentFilter = () => {
    setSelectedDepartmentFilter('');
  };

  const finalizeFirebaseAuth = async (firebaseUser, preferredDisplayName = '') => {
    const displayName = preferredDisplayName || firebaseUser.displayName || firebaseUser.email.split('@')[0];

    const res = await fetch(`${API_BASE_URL}/api/auth/firebaseLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed on server');

    localStorage.setItem('token', data.token);
    setToken(data.token);
    await fetchProfile(data.token);
    setProfileViewUsername(null);
    setActiveView('home');
  };

  const handleGoogleAuth = async () => {
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      const result = await signInWithPopup(auth, provider);
      await finalizeFirebaseAuth(result.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async ({ mode, displayName, email, password }) => {
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      if (mode === 'signup') {
        const nextDisplayName = displayName || email.split('@')[0];
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: nextDisplayName });
        await finalizeFirebaseAuth(result.user, nextDisplayName);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await finalizeFirebaseAuth(result.user);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    firebaseSignOut(auth).catch(() => {});
    localStorage.removeItem('token');
    setToken(null);
    setUserProfile(null);
    setViewedProfileMeta(null);
    setProfileViewUsername(null);
    setIsProfileMenuOpen(false);
    setAuthError('');
    setSelectedDepartmentFilter('');
    if (activeView === 'profile' || activeView === 'create' || activeView === 'bookmarks') setActiveView('home');
  };

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.username) return;

    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch(`${API_BASE_URL}/api/users/profile/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to upload profile photo');

      setProfilePhotoUrl(data.profilePhotoUrl || '');
      setUserProfile((currentProfile) => (
        currentProfile ? { ...currentProfile, profilePhotoUrl: data.profilePhotoUrl || '' } : currentProfile
      ));
      setViewedProfileMeta((currentProfile) => (
        currentProfile?.username === userProfile.username
          ? { ...currentProfile, profilePhotoUrl: data.profilePhotoUrl || '' }
          : currentProfile
      ));
      setIsProfileMenuOpen(false);
      event.target.value = '';
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', postForm.title);
      formData.append('description', postForm.description);
      formData.append('location', postForm.location);
      formData.append('department', postForm.department);
      formData.append('media', postForm.media);
      mediaFiles.forEach(file => formData.append('files', file));

      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Failed to post issue');
      
      await fetchPublicData();
      setActiveView('home');
      setPostForm({ title: '', description: '', location: '', department: 'General', media: 'IMAGE' });
      setMediaFiles([]);
    } catch (err) {
      alert(err.message);
    }
  };

  const updatePostInteraction = async (postId, action, body = null, requiresAuth = true) => {
    if (requiresAuth && !ensureAuthenticated()) return null;

    const headers = body
      ? {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      : (token ? { Authorization: `Bearer ${token}` } : {});

    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/${action}`, {
      method: 'POST',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Failed to ${action}`);
    upsertPostInState(data);
    return data;
  };

  const updateSolutionInteraction = async (postId, solutionIndex, action, body = null, requiresAuth = true) => {
    if (requiresAuth && !ensureAuthenticated()) return null;

    const headers = {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/solutions/${solutionIndex}/${action}`, {
      method: 'POST',
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Failed to ${action} solution`);
    upsertPostInState(data);
    return data;
  };

  const withPostActionSubmitting = async (postId, actionFn) => {
    setIsActionSubmittingByPost((current) => ({ ...current, [postId]: true }));
    try {
      await actionFn();
    } finally {
      setIsActionSubmittingByPost((current) => ({ ...current, [postId]: false }));
    }
  };

  const withSolutionActionSubmitting = async (solutionStateKey, actionFn) => {
    setIsSolutionActionSubmittingByKey((current) => ({ ...current, [solutionStateKey]: true }));
    try {
      await actionFn();
    } finally {
      setIsSolutionActionSubmittingByKey((current) => ({ ...current, [solutionStateKey]: false }));
    }
  };

  const handleSupport = async (postId) => {
    try {
      await withPostActionSubmitting(postId, () => updatePostInteraction(postId, 'support', null, true));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!ensureAuthenticated()) return;
    if (!window.confirm('Delete this post permanently? This cannot be undone.')) return;

    try {
      await withPostActionSubmitting(postId, async () => {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
          method: 'DELETE',
          headers,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || 'Failed to delete post');

        removePostFromState(postId);
        if (activePostId === postId) {
          setActivePostId(null);
          setActiveView('home');
        }

        setUserProfile((currentProfile) => {
          if (!currentProfile) return currentProfile;
          const nextPostsCount = Math.max(toCount(currentProfile.postsCount) - 1, 0);
          return {
            ...currentProfile,
            postsCount: nextPostsCount,
            reputation: 540 + nextPostsCount * 10,
          };
        });
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleShare = async (postId) => {
    try {
      await withPostActionSubmitting(postId, async () => {
        const currentUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;

        if (navigator.share) {
          await navigator.share({ title: 'Public Policy Hub Post', url: currentUrl });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(currentUrl);
        }

        await updatePostInteraction(postId, 'share', null, false);
      });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        alert(error.message || 'Failed to share post');
      }
    }
  };

  const handleSolutionSubmit = async (postId) => {
    const text = `${solutionInputsByPost[postId] ?? ''}`.trim();
    if (!text) return;

    try {
      await withPostActionSubmitting(postId, () => updatePostInteraction(postId, 'solutions', { text }, true));
      setSolutionInputsByPost((current) => ({ ...current, [postId]: '' }));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSolutionVote = async (postId, solutionIndex, voteType, targetPath = []) => {
    const solutionStateKey = getSolutionStateKey(postId, solutionIndex, targetPath);

    try {
      await withSolutionActionSubmitting(solutionStateKey, () =>
        updateSolutionInteraction(postId, solutionIndex, 'vote', { voteType, targetPath }, true)
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSolutionReplySubmit = async (postId, solutionIndex, parentPath = []) => {
    const solutionStateKey = getSolutionStateKey(postId, solutionIndex, parentPath);
    const text = `${solutionReplyInputsByKey[solutionStateKey] ?? ''}`.trim();
    if (!text) return;

    try {
      await withSolutionActionSubmitting(solutionStateKey, () =>
        updateSolutionInteraction(postId, solutionIndex, 'replies', { text, parentPath }, true)
      );
      setSolutionReplyInputsByKey((current) => ({ ...current, [solutionStateKey]: '' }));
      setVisibleRepliesByKey((current) => ({ ...current, [solutionStateKey]: true }));
      setActiveReplyComposerByKey((current) => ({ ...current, [solutionStateKey]: false }));
    } catch (error) {
      alert(error.message);
    }
  };

  const focusSolutionReplyInput = (postId, solutionIndex, parentPath = []) => {
    const solutionStateKey = getSolutionStateKey(postId, solutionIndex, parentPath);
    setActiveReplyComposerByKey((current) => ({ ...current, [solutionStateKey]: true }));
    setVisibleRepliesByKey((current) => ({ ...current, [solutionStateKey]: true }));
    setTimeout(() => {
      const inputElement = solutionReplyInputRefs.current[solutionStateKey];
      if (inputElement) inputElement.focus();
    }, 0);
  };

  const toggleSolutionReplies = (solutionStateKey) => {
    setVisibleRepliesByKey((current) => ({ ...current, [solutionStateKey]: !current[solutionStateKey] }));
  };

  const handleSolutionClick = (postId) => {
    setActivePostId(postId);
    setActiveView('post');
    setTimeout(() => {
      const inputElement = solutionInputRefs.current[postId];
      if (inputElement) inputElement.focus();
    }, 0);
  };

  const openAuthorProfile = (username) => {
    if (!username) return;
    setProfileViewUsername(username);
    setProfileTab('reports');
    setActivePostId(null);
    setActiveView('profile');
  };

  const openOwnProfile = () => {
    if (!userProfile?.username) return;
    setProfileViewUsername(userProfile.username);
    setProfileTab('reports');
    setActivePostId(null);
    setActiveView('profile');
    setIsProfileMenuOpen(false);
  };

  const handleToggleProfileFollow = async () => {
    if (!resolvedProfileUsername || resolvedProfileUsername === userProfile?.username) return;
    if (!ensureAuthenticated()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${resolvedProfileUsername}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update follow state');

      setUserProfile((currentProfile) => (
        currentProfile
          ? { ...currentProfile, following: Array.isArray(data.following) ? data.following : currentProfile.following }
          : currentProfile
      ));
      setViewedProfileMeta((currentProfile) => (
        currentProfile && currentProfile.username === resolvedProfileUsername
          ? {
              ...currentProfile,
              followerCount: data.followerCount,
              followingCount: data.followingCount,
              isFollowing: data.isFollowing,
            }
          : currentProfile
      ));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleProfileShare = async () => {
    if (!resolvedProfileUsername || typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}${window.location.pathname}#profile-${resolvedProfileUsername}`;
    const shareTitle = `${resolvedProfileUsername} on Public Policy Hub`;
    const shareText = `Track reports, fixes, and public signal from ${resolvedProfileUsername}.`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
        setProfileShareFeedback('Profile shared');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setProfileShareFeedback('Profile link copied');
      } else {
        setProfileShareFeedback(`Share @${resolvedProfileUsername}`);
      }
    } catch {
      setProfileShareFeedback('');
    }

    window.setTimeout(() => setProfileShareFeedback(''), 2200);
  };

  const handleToggleSavedPost = async (postId) => {
    if (!postId) return;
    if (!ensureAuthenticated()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update bookmarks');

      setUserProfile((currentProfile) => (
        currentProfile
          ? {
              ...currentProfile,
              bookmarkedPostIds: Array.isArray(data.bookmarkedPostIds) ? data.bookmarkedPostIds : currentProfile.bookmarkedPostIds,
            }
          : currentProfile
      ));
    } catch (error) {
      alert(error.message);
    }
  };

  const handleThemeToggle = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
    setIsProfileMenuOpen(false);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-semibold text-slate-500">Connecting to server...</div>;

  if (activeView === 'auth') {
    return (
      <AuthPage
        error={authError}
        isSubmitting={isAuthSubmitting}
        logo={Logo}
        onBack={() => setActiveView('home')}
        onEmailAuth={handleEmailAuth}
        onGoogleAuth={handleGoogleAuth}
      />
    );
  }

  const filteredHomePosts = selectedDepartmentFilter
    ? apiPosts.filter((post) => `${post?.department ?? ''}`.trim() === selectedDepartmentFilter)
    : apiPosts;
  const topCaseCategories = Object.entries(
    apiPosts.reduce((counts, post) => {
      const department = `${post?.department ?? ''}`.trim();
      if (!department) return counts;
      counts[department] = (counts[department] ?? 0) + 1;
      return counts;
    }, {})
  )
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .slice(0, 6);
  const trendingPosts = [...apiPosts]
    .sort((a, b) => getTrendingScore(b) - getTrendingScore(a))
    .slice(0, 8);
  const activePost = activePostId ? apiPosts.find((post) => post.id === activePostId) ?? null : null;
  const activePostSolutions = getPostSolutions(activePost);
  const accountUsername = userProfile?.username || '';
  const savedPostIds = Array.isArray(userProfile?.bookmarkedPostIds)
    ? [...new Set(userProfile.bookmarkedPostIds.filter(Boolean))]
    : [];
  const bookmarkedPosts = apiPosts.filter((post) => savedPostIds.includes(post.id));
  const bookmarkedDepartmentsCount = new Set(bookmarkedPosts.map((post) => post.department).filter(Boolean)).size;
  const bookmarkedTopDepartment = getMostFrequentValue(bookmarkedPosts.map((post) => post.department)) || 'No lead category yet';
  const isOwnProfile = !!userProfile && resolvedProfileUsername === userProfile.username;
  const profilePosts = resolvedProfileUsername
    ? apiPosts.filter((post) => post.author === resolvedProfileUsername)
    : [];
  const profileSolutions = resolvedProfileUsername ? collectSolutionsByAuthor(apiPosts, resolvedProfileUsername) : [];
  const profileLocation = getMostFrequentValue(profilePosts.map((post) => post.location)) || 'India';
  const profileBeat = getMostFrequentValue(profilePosts.map((post) => post.department)) || 'Public accountability';
  const profileSupportReceived = profilePosts.reduce((total, post) => total + toCount(post.support), 0);
  const profileCommentsReceived = profilePosts.reduce((total, post) => total + toCount(post.comments), 0);
  const profileCommunitiesCount = new Set(profilePosts.map((post) => post.department).filter(Boolean)).size;
  const profileFollowerBase = Math.max(
    18,
    Math.round((profileSupportReceived / 4) + (profileSolutions.length * 9) + (profilePosts.length * 15)),
  );
  const profileFollowingBase = Math.max(
    12,
    Math.round((profilePosts.length * 2) + profileSolutions.length + profileCommunitiesCount + 8),
  );
  const profileFollowersCount = viewedProfileMeta?.followerCount ?? profileFollowerBase;
  const profileFollowingCount = viewedProfileMeta?.followingCount ?? profileFollowingBase;
  const isFollowingViewedProfile = !!accountUsername
    && accountUsername !== resolvedProfileUsername
    && !!viewedProfileMeta?.isFollowing;
  const profileDisplay = isOwnProfile
    ? {
        username: userProfile.username,
        role: userProfile.role,
        postsCount: Math.max(toCount(userProfile.postsCount), profilePosts.length),
        solutionsProposed: Math.max(toCount(userProfile.solutionsProposed), profileSolutions.length),
        reputation: Math.max(toCount(userProfile.reputation), 540 + Math.round(profileSupportReceived / 2)),
      }
    : {
        username: viewedProfileMeta?.username || resolvedProfileUsername,
        role: viewedProfileMeta?.role || 'CitizenReporter',
        postsCount: Math.max(toCount(viewedProfileMeta?.postsCount), profilePosts.length),
        solutionsProposed: Math.max(toCount(viewedProfileMeta?.solutionsProposed), profileSolutions.length, profilePosts.length > 0 ? 1 : 0),
        reputation: Math.max(
          toCount(viewedProfileMeta?.reputation),
          500 + (profilePosts.length * 10) + (profileSolutions.length * 12) + Math.round(profileSupportReceived / 3),
        ),
      };
  const profileBio = isOwnProfile
    ? `Building visible public pressure through ${profileBeat.toLowerCase()} reports, evidence threads, and solution-first follow ups.`
    : `${resolvedProfileUsername} tracks ${profileBeat.toLowerCase()} issues, adds context quickly, and keeps pressure on until the signal is impossible to ignore.`;
  const profileJoinLabel = getProfileJoinLabel(resolvedProfileUsername);
  const profileImpactScore = Math.max(
    61,
    Math.min(98, 62 + (profilePosts.length * 4) + (profileSolutions.length * 3) + Math.round(profileCommentsReceived / 12)),
  );
  const viewedProfilePhotoUrl = resolvedProfileUsername
    ? (
        resolvedProfileUsername === userProfile?.username
          ? profilePhotoUrl
          : (viewedProfileMeta?.profilePhotoUrl || '')
      )
    : '';
  const profileActivityFeed = buildProfileActivityFeed(profilePosts, profileSolutions).slice(0, 8);
  const latestProfilePost = profilePosts[0] ?? null;
  const profileTopLocations = [...new Set(profilePosts.map((post) => post.location).filter(Boolean))].slice(0, 4);
  const accountInitials = accountUsername ? accountUsername.substring(0, 2) : 'PP';
  const profileInitials = getInitials(profileDisplay.username);

  const renderPostMedia = (post) => {
    const mediaList = Array.isArray(post?.mediaList) ? post.mediaList : [];
    const activeSlideIndex = mediaSlideIndexByPost[post.id] ?? 0;
    const canGoPrev = activeSlideIndex > 0;
    const canGoNext = activeSlideIndex < mediaList.length - 1;

    return (
      <>
        <div className="video-shell order-1 relative overflow-hidden">
          {mediaList.length > 0 ? (
            <div
              ref={(element) => setMediaScrollerRef(post.id, element)}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
              onScroll={(event) => handleMediaScroll(post.id, event)}
            >
              {mediaList.map((media, index) => {
                const resolvedMediaUrl = resolveMediaUrl(media?.url);
                const qualityOptions = buildMediaQualityOptions(media, resolvedMediaUrl);
                return (
                  <div key={`${post.id}-media-${index}`} className="w-full h-full flex-shrink-0 snap-center relative" data-media-slide="true">
                    {media.type === 'VIDEO' ? (
                      <EnhancedVideoPlayer
                        src={resolvedMediaUrl}
                        title={post.title}
                        qualityOptions={qualityOptions}
                      />
                    ) : (
                      <img src={resolvedMediaUrl} alt={post.title} className="h-full w-full object-contain bg-slate-950" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,_transparent_0%,_rgba(2,6,23,0.62)_100%)]" />
              <div className="absolute left-3 top-3 rounded-md bg-slate-950/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{post.media}</div>
              <button className="pulse-ring absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </button>
            </>
          )}

          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => scrollMediaByStep(post.id, -1)}
                disabled={!canGoPrev}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/55 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollMediaByStep(post.id, 1)}
                disabled={!canGoNext}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/55 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {mediaList.length > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {mediaList.map((_, dotIndex) => (
              <button
                key={`${post.id}-dot-${dotIndex}`}
                type="button"
                onClick={() => {
                  const container = mediaScrollerRefs.current[post.id];
                  if (!container) return;
                  container.scrollTo({
                    left: dotIndex * container.clientWidth,
                    behavior: 'smooth',
                  });
                  setMediaSlideIndexByPost((current) => (
                    current[post.id] === dotIndex ? current : { ...current, [post.id]: dotIndex }
                  ));
                }}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  activeSlideIndex === dotIndex ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                aria-label={`Go to media ${dotIndex + 1}`}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  const renderDiscussionEntry = (postId, entry, depth = 0) => {
    const solutionIndex = entry.sourceIndex ?? 0;
    const replyPath = Array.isArray(entry.path) ? entry.path : [];
    const solutionStateKey = getSolutionStateKey(postId, solutionIndex, replyPath);
    const currentVote = getSolutionVoteForUser(entry, userProfile?.username);
    const replyInput = solutionReplyInputsByKey[solutionStateKey] ?? '';
    const isSolutionActionSubmitting = !!isSolutionActionSubmittingByKey[solutionStateKey];
    const replies = Array.isArray(entry.replies) ? entry.replies : [];
    const canInteract = !entry.isFallback && Number.isInteger(solutionIndex) && solutionIndex >= 0;
    const areRepliesVisible = replies.length > 0 ? !!visibleRepliesByKey[solutionStateKey] : false;
    const isReplyComposerOpen = !!activeReplyComposerByKey[solutionStateKey];
    const agreeCount = Array.isArray(entry.upvoters) ? entry.upvoters.length : 0;
    const disagreeCount = Array.isArray(entry.downvoters) ? entry.downvoters.length : 0;
    const indentPx = depth > 0 ? Math.min(depth, 6) * 18 : 0;

    return (
      <div
        key={`${solutionStateKey}-${entry.key ?? formatTimestamp(entry.createdAt)}`}
        className={`${depth === 0 ? 'border-b border-slate-200/80 pb-4 last:border-b-0 last:pb-0' : ''}`}
        style={indentPx > 0 ? { marginLeft: `${indentPx}px` } : undefined}
      >
        <div className="flex items-start gap-3">
          <div className={`flex shrink-0 items-center justify-center rounded-full ${depth === 0 ? 'h-9 w-9 bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-[11px] text-white' : 'h-8 w-8 bg-slate-200 text-[10px] text-slate-700'} font-bold uppercase`}>
            {getInitials(entry.author || 'Community member')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="pr-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{entry.author || 'Community member'}</p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{entry.text}</p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
              <span>{formatTimestamp(entry.createdAt)}</span>
              <button
                type="button"
                disabled={isSolutionActionSubmitting || !canInteract}
                onClick={() => handleSolutionVote(postId, solutionIndex, currentVote === 'up' ? 'clear-up' : 'up', replyPath)}
                className={`transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentVote === 'up' ? 'text-emerald-700' : 'hover:text-slate-800'
                }`}
              >
                Agree {agreeCount > 0 ? agreeCount : ''}
              </button>
              <button
                type="button"
                disabled={isSolutionActionSubmitting || !canInteract}
                onClick={() => handleSolutionVote(postId, solutionIndex, currentVote === 'down' ? 'clear-down' : 'down', replyPath)}
                className={`transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentVote === 'down' ? 'text-red-600' : 'hover:text-slate-800'
                }`}
              >
                Disagree {disagreeCount > 0 ? disagreeCount : ''}
              </button>
              <button
                type="button"
                disabled={!canInteract}
                onClick={() => focusSolutionReplyInput(postId, solutionIndex, replyPath)}
                className="transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reply
              </button>
              <span className={`rounded-full px-2 py-0.5 ${entry.score > 0 ? 'bg-emerald-50 text-emerald-700' : entry.score < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                Net {entry.score}
              </span>
            </div>

            {replies.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleSolutionReplies(solutionStateKey)}
                  className="text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                >
                  {areRepliesVisible ? 'Hide replies' : `View replies (${replies.length})`}
                </button>
              </div>
            )}

            {areRepliesVisible && replies.length > 0 && (
              <div className="mt-3 space-y-3 border-l border-slate-200/80 pl-3">
                {replies.map((reply) => renderDiscussionEntry(postId, reply, depth + 1))}
              </div>
            )}

            {canInteract && isReplyComposerOpen && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSolutionReplySubmit(postId, solutionIndex, replyPath);
                }}
                className="mt-3 flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold uppercase text-white">
                  {getInitials(userProfile?.username || 'You')}
                </div>
                <div className="flex-1 rounded-[22px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <textarea
                    ref={(element) => {
                      solutionReplyInputRefs.current[solutionStateKey] = element;
                    }}
                    value={replyInput}
                    onChange={(event) => setSolutionReplyInputsByKey((current) => ({ ...current, [solutionStateKey]: event.target.value }))}
                    rows={2}
                    placeholder="Write a reply..."
                    className="w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    disabled={isSolutionActionSubmitting}
                  />
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveReplyComposerByKey((current) => ({ ...current, [solutionStateKey]: false }))}
                      className="text-xs font-semibold text-slate-500 transition hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSolutionActionSubmitting || !replyInput.trim()}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1580px] items-center px-4 lg:px-6">
          <div className="flex w-full items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActivePostId(null);
                setProfileViewUsername(null);
                setActiveView('home');
              }}
              className="flex items-center gap-2.5"
            >
              <img src={Logo} alt="Public Policy Hub Logo" style={{ height: '90px' }} className="w-auto object-contain -my-4" />
              <div className="hidden sm:block">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-slate-500">Public Policy Hub</p>
                <p className="text-sm text-slate-600">Clear reporting, visible progress</p>
              </div>
            </button>

            <div className="ml-auto flex items-center gap-2">
              {userProfile ? (
                 <>
                  <button onClick={() => handleNavClick('create')} className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:inline-flex">
                    Report Issue
                  </button>
                  <div className="relative flex items-center gap-2" ref={profileMenuRef}>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                    />

                    <button
                      type="button"
                      onClick={openOwnProfile}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 transition hover:bg-slate-50"
                    >
                      {profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="h-10 w-10 rounded-2xl object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white uppercase">
                          {accountInitials}
                        </span>
                      )}
                      <span className="hidden text-left sm:block">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Profile</span>
                        <span className="block text-sm font-bold text-slate-900">{accountUsername}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsProfileMenuOpen((current) => !current)}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                      aria-label="Open profile menu"
                    >
                      <ChevronDown className={`h-4 w-4 transition ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-14 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]">
                        <button
                          type="button"
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <ImageIcon className="h-4 w-4" />
                          Edit photo
                        </button>
                        <button
                          type="button"
                          onClick={handleThemeToggle}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Lightbulb className="h-4 w-4" />
                          Switch theme
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                 </>
              ) : (
                <button onClick={openAuthPage} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mobile-safe mx-auto grid w-full max-w-[1580px] gap-5 px-4 pb-24 pt-5 lg:grid-cols-[270px_minmax(0,1fr)_290px] lg:gap-7 lg:px-6">
        <aside className="hidden space-y-4 lg:sticky lg:top-[92px] lg:block lg:h-fit lg:border-r lg:border-slate-200 lg:pr-4">
          <div className="soft-card p-4">
            <p className="px-2 text-sm font-semibold text-slate-500">Navigation</p>
            <div className="mt-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.Icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-base font-semibold transition ${
                      activeView === item.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="soft-card p-4">
            <div className="flex items-center justify-between gap-3 px-2">
              <p className="text-sm font-semibold text-slate-500">Most Cases</p>
              {selectedDepartmentFilter && (
                <button
                  type="button"
                  onClick={clearDepartmentFilter}
                  className="text-xs font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="mt-3 space-y-2">
              {topCaseCategories.map(([department, count], index) => (
                <button
                  type="button"
                  key={`${department}-${count}`}
                  onClick={() => handleDepartmentFilterSelect(department)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${
                    selectedDepartmentFilter === department
                      ? 'border-blue-200 bg-blue-50 shadow-[0_14px_30px_-24px_rgba(37,99,235,0.75)]'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                      selectedDepartmentFilter === department ? 'text-blue-700' : 'text-slate-500'
                    }`}
                    >
                      {selectedDepartmentFilter === department ? 'Active filter' : `#${index + 1} Category`}
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-900">{department}</p>
                  </div>
                  <div className="ml-3 text-right">
                    <p className="text-lg font-bold text-slate-950">{formatCount(count)}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">cases</p>
                  </div>
                </button>
              ))}

              {topCaseCategories.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                  No category data yet.
                </p>
              )}
            </div>
          </div>
        </aside>

        <section className="mx-auto w-full max-w-[980px] space-y-6">
          {activeView === 'home' && (
            <>
              <div className="soft-card p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Post Section</p>
                    <h2 className="mt-1.5 font-display text-[30px] font-bold text-slate-950">Community reports and updates</h2>
                    <p className="mt-2 text-base text-slate-500">
                      {selectedDepartmentFilter
                        ? `Showing the latest reports from ${selectedDepartmentFilter}.`
                        : 'Evidence-first reports from citizens and contributors.'}
                    </p>
                  </div>

                  {selectedDepartmentFilter && (
                    <button
                      type="button"
                      onClick={clearDepartmentFilter}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Building2 className="h-4 w-4" />
                      {selectedDepartmentFilter}
                      <span className="text-blue-400">/</span>
                      Clear
                    </button>
                  )}
                </div>
                {selectedDepartmentFilter && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                    Filtering the main feed by department while keeping the sidebar rankings based on all reported cases.
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {filteredHomePosts.map((post) => {
                  const isSupportedByUser = !!userProfile?.username && post.supporters?.includes(userProfile.username);
                  const isSavedByUser = savedPostIds.includes(post.id);
                  const isOwnPost = !!userProfile?.username && post.author === userProfile.username;
                  const isSubmittingAction = !!isActionSubmittingByPost[post.id];
                  const isDescriptionExpanded = !!expandedDescriptionByPost[post.id];
                  const { previewText, isTruncated } = getDescriptionPreview(post.description, isDescriptionExpanded);

                  return (
                    <article
                      key={post.id}
                      className="soft-card group overflow-hidden p-4 transition hover:shadow-[0_16px_42px_-28px_rgba(15,23,42,0.38)] sm:p-5"
                    >
                      <div className="space-y-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openAuthorProfile(post.author);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-1 text-left"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white">
                          {post.author.slice(0, 2)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{post.author}</p>
                          <p className="text-xs text-slate-500">{post.time}</p>
                        </div>
                      </button>
                      <div>
                        <h3 className="font-display text-2xl font-bold leading-tight text-slate-950">{post.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{previewText}</p>
                        {isTruncated && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDescriptionByPost((current) => ({ ...current, [post.id]: !isDescriptionExpanded }))
                            }
                            className="mt-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                          >
                            {isDescriptionExpanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>
                      {renderPostMedia(post)}

                      <div className="order-2 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700"><MapPin className="h-3.5 w-3.5" />{post.location}</span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600"><Building2 className="h-3.5 w-3.5" />{post.department}</span>
                          {post.verified && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleSupport(post.id)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isSupportedByUser
                                ? 'border-blue-700 bg-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(29,78,216,0.9)] ring-1 ring-blue-500/60 hover:bg-blue-700'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <TrendingUp className="h-4 w-4" />
                            Support {formatCount(post.support)}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleSolutionClick(post.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Lightbulb className="h-4 w-4" />
                            Solution {formatCount(post.solutions)}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleShare(post.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Share2 className="h-4 w-4" />
                            Share {formatCount(post.shares)}
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleToggleSavedPost(post.id)}
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isSavedByUser
                                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${isSavedByUser ? 'fill-current' : ''}`} />
                            {isSavedByUser ? 'Saved' : 'Save'}
                          </button>
                        </div>
                        {isOwnPost && (
                          <button
                            type="button"
                            disabled={isSubmittingAction}
                            onClick={() => handleDeletePost(post.id)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Post
                          </button>
                        )}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold text-slate-500">Top Fix</p>
                          <p className="mt-2 break-words text-sm font-semibold leading-6 text-slate-900">{post.fixes?.[0] || 'Awaiting suggested fixes'}</p>
                        </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredHomePosts.length === 0 && (
                  <div className="soft-card p-6 text-sm text-slate-600">
                    {selectedDepartmentFilter
                      ? `No reports found for ${selectedDepartmentFilter} yet. Try another category or clear the filter.`
                      : 'No posts available yet. Trending posts will appear here once issues are published.'}
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'bookmarks' && (
            <>
              <div className="soft-card p-7">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      <Bookmark className="h-3.5 w-3.5 fill-current" />
                      Personal Library
                    </span>
                    <h2 className="mt-4 font-display text-[30px] font-bold text-slate-950">Saved posts</h2>
                    <p className="mt-2 text-base text-slate-500">
                      A clean place to revisit the reports you want to track, share, or come back to later.
                    </p>
                  </div>

                  <div className="grid w-full gap-3 sm:max-w-[460px] sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Saved posts</p>
                      <p className="mt-2 font-display text-2xl font-bold text-slate-950">{formatCount(bookmarkedPosts.length)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Departments</p>
                      <p className="mt-2 font-display text-2xl font-bold text-slate-950">{formatCount(bookmarkedDepartmentsCount)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Top category</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{bookmarkedTopDepartment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {bookmarkedPosts.map((post) => (
                  <BookmarkedPostCard
                    key={`${post.id}-bookmark`}
                    post={post}
                    onOpenPost={() => {
                      setActivePostId(post.id);
                      setActiveView('post');
                    }}
                    onOpenAuthor={() => openAuthorProfile(post.author)}
                    onToggleSave={() => handleToggleSavedPost(post.id)}
                  />
                ))}

                {bookmarkedPosts.length === 0 && (
                  <div className="soft-card p-7">
                    <EmptyProfilePanel
                      icon={<Bookmark className="h-5 w-5" />}
                      title="No saved posts yet"
                      description="Use the save button on any post to keep it in your bookmarks."
                    />
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={() => handleNavClick('home')}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Browse reports
                        <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'post' && (
            <div className="space-y-0">
              {!activePost && (
                <div className="soft-card p-6">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePostId(null);
                      setActiveView('home');
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to feed
                  </button>
                  <p className="mt-4 text-sm text-slate-600">This post is no longer available.</p>
                </div>
              )}

              {activePost && (() => {
                const isSupportedByUser = !!userProfile?.username && activePost.supporters?.includes(userProfile.username);
                const isSavedByUser = savedPostIds.includes(activePost.id);
                const isOwnActivePost = !!userProfile?.username && activePost.author === userProfile.username;
                const solutionInput = solutionInputsByPost[activePost.id] ?? '';
                const isSubmittingAction = !!isActionSubmittingByPost[activePost.id];
                const isDescriptionExpanded = !!expandedDescriptionByPost[activePost.id];
                const {
                  previewText: activeDescriptionPreview,
                  isTruncated: isActiveDescriptionTruncated
                } = getDescriptionPreview(activePost.description, isDescriptionExpanded, 260);

                return (
                  <>
                    <article className="soft-card overflow-hidden rounded-b-none border-b-0 p-5">
                      <div className="space-y-4">
                        <button
                          type="button"
                          onClick={() => {
                            setActivePostId(null);
                            setActiveView('home');
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to feed
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openAuthorProfile(activePost.author);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-1 text-left"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white">
                            {activePost.author.slice(0, 2)}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{activePost.author}</p>
                            <p className="text-xs text-slate-500">{activePost.time}</p>
                          </div>
                        </button>

                        <div>
                          <h3 className="font-display text-2xl font-bold leading-tight text-slate-950">{activePost.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{activeDescriptionPreview}</p>
                          {isActiveDescriptionTruncated && (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDescriptionByPost((current) => ({ ...current, [activePost.id]: !isDescriptionExpanded }))
                              }
                              className="mt-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                              {isDescriptionExpanded ? 'Read less' : 'Read more'}
                            </button>
                          )}
                        </div>

                        {renderPostMedia(activePost)}

                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700"><MapPin className="h-3.5 w-3.5" />{activePost.location}</span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600"><Building2 className="h-3.5 w-3.5" />{activePost.department}</span>
                            {activePost.verified && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleSupport(activePost.id)}
                              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isSupportedByUser
                                  ? 'border-blue-700 bg-blue-600 text-white shadow-[0_10px_24px_-14px_rgba(29,78,216,0.9)] ring-1 ring-blue-500/60 hover:bg-blue-700'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <TrendingUp className="h-4 w-4" />
                              Support {formatCount(activePost.support)}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleSolutionClick(activePost.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Lightbulb className="h-4 w-4" />
                              Solution {formatCount(activePost.solutions)}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleShare(activePost.id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Share2 className="h-4 w-4" />
                              Share {formatCount(activePost.shares)}
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleToggleSavedPost(activePost.id)}
                              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isSavedByUser
                                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Bookmark className={`h-4 w-4 ${isSavedByUser ? 'fill-current' : ''}`} />
                              {isSavedByUser ? 'Saved' : 'Save'}
                            </button>
                          </div>

                          {isOwnActivePost && (
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleDeletePost(activePost.id)}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Post
                            </button>
                          )}

                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleSolutionSubmit(activePost.id);
                            }}
                            className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                          >
                            <textarea
                              ref={(element) => {
                                solutionInputRefs.current[activePost.id] = element;
                              }}
                              value={solutionInput}
                              onChange={(event) => setSolutionInputsByPost((current) => ({ ...current, [activePost.id]: event.target.value }))}
                              placeholder="Write your solution..."
                              rows={3}
                              wrap="soft"
                              className="w-full min-h-[96px] resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 whitespace-pre-wrap break-words"
                              autoFocus
                              disabled={isSubmittingAction}
                            />
                            <button
                              type="submit"
                              disabled={isSubmittingAction || !solutionInput.trim()}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Lightbulb className="h-4 w-4" />
                              Post
                            </button>
                          </form>
                        </div>
                      </div>
                    </article>

                    <div className="soft-card rounded-t-none p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Comments & Solutions</p>
                      <h3 className="mt-1.5 font-display text-2xl font-bold text-slate-950">{formatCount(activePost.solutions)} community responses</h3>
                      <p className="mt-2 text-sm text-slate-500">Structured like an Instagram comment sheet, with Agree, Disagree, Reply, and Net kept intact.</p>

                      <div className="mt-5 space-y-5">
                        {activePostSolutions.length === 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            No solutions yet. Be the first to post one.
                          </div>
                        )}

                        {activePostSolutions.map((solution) => renderDiscussionEntry(activePost.id, solution, 0))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeView === 'create' && (
            <div className="soft-card p-6">
              <p className="text-xs font-semibold text-slate-500">Create New Issue</p>
              <h2 className="mt-1.5 font-display text-[28px] font-bold text-slate-950">Simple, mobile-friendly reporting.</h2>
              <form onSubmit={handlePostSubmit} className="mt-6 space-y-5">
                <div className="space-y-4">
                  <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="flex gap-2 mb-2">
                        <ImageIcon className="h-6 w-6 text-orange-500" />
                        <VideoIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Click or drag files to upload</p>
                      <p className="text-xs text-slate-500 mt-1">Photos and Videos (Max 10)</p>
                    </div>
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                  </label>

                  {mediaFiles.length > 0 && (
                    <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
                      {mediaFiles.map((file, idx) => (
                        <div key={idx} className="relative shrink-0 snap-start h-20 w-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                          {file.type.startsWith('video/') ? (
                            <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" />
                          ) : (
                            <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover" />
                          )}
                          <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 h-5 w-5 bg-slate-900/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition backdrop-blur-sm">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" placeholder="Title" required className="form-input" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="Location" required className="form-input" value={postForm.location} onChange={e => setPostForm({...postForm, location: e.target.value})} />
                  <select className="form-input" value={postForm.department} onChange={e => setPostForm({...postForm, department: e.target.value})}>
                      <option>General</option><option>Police</option><option>Municipality</option><option>Education</option><option>Transport</option>
                  </select>
                </div>
                <textarea rows="5" placeholder="Description" required className="w-full min-h-[140px] resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" value={postForm.description} onChange={e => setPostForm({...postForm, description: e.target.value})} />
                <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Post Issue as {userProfile?.username}</button>
              </form>
            </div>
          )}

          {activeView === 'alerts' && (
            <div className="soft-card p-6">
              <p className="text-xs font-semibold text-slate-500">Notifications</p>
              <h2 className="mt-1.5 font-display text-[28px] font-bold text-slate-950">Updates related to your reports</h2>
              <div className="mt-6 space-y-3">
                {apiNotifications.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{item}</div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'profile' && (userProfile || profileViewUsername) && (
            <div className="space-y-5">
              <ProfileView
                isOwnProfile={isOwnProfile}
                profileDisplay={profileDisplay}
                profileInitials={profileInitials}
                profileBio={profileBio}
                profileBeat={profileBeat}
                profileLocation={profileLocation}
                profileJoinLabel={profileJoinLabel}
                profileCommunitiesCount={profileCommunitiesCount}
                profileImpactScore={profileImpactScore}
                profileFollowersCount={profileFollowersCount}
                profileFollowingCount={profileFollowingCount}
                profilePosts={profilePosts}
                profileSolutions={profileSolutions}
                profileActivityFeed={profileActivityFeed}
                profileTab={profileTab}
                profileShareFeedback={profileShareFeedback}
                viewedProfilePhotoUrl={viewedProfilePhotoUrl}
                isFollowingViewedProfile={isFollowingViewedProfile}
                latestProfilePost={latestProfilePost}
                profileTopLocations={profileTopLocations}
                onSelectTab={setProfileTab}
                onEditPhoto={() => profilePhotoInputRef.current?.click()}
                onCreateReport={() => handleNavClick('create')}
                onToggleTheme={handleThemeToggle}
                onToggleFollow={handleToggleProfileFollow}
                onShareProfile={handleProfileShare}
                onOpenLatestPost={() => {
                  if (!latestProfilePost) return;
                  setActivePostId(latestProfilePost.id);
                  setActiveView('post');
                }}
                onOpenPost={(postId) => {
                  setActivePostId(postId);
                  setActiveView('post');
                }}
                onOpenProfile={openAuthorProfile}
                onLogout={handleLogout}
              />
              {profileTab === '__legacy__' && (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {isOwnProfile && profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="h-24 w-24 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-3xl font-bold text-white uppercase">{profileInitials}</div>
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">{profileDisplay.role}</p>
                  <h2 className="mt-1.5 font-display text-[28px] font-bold text-slate-950">{profileDisplay.username}</h2>
                  <p className="mt-2 text-sm text-slate-500">Posts: {profileDisplay.postsCount} • Solutions Proposed: {profileDisplay.solutionsProposed}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MetricBox label="Reputation" value={profileDisplay.reputation} dark={false} />
                    <MetricBox label="Badges" value={profileDisplay.badgesCount} dark={false} />
                    <MetricBox label="Streak" value={profileDisplay.streak} dark={false} />
                  </div>
                  {isOwnProfile && (
                    <button onClick={handleLogout} className="mt-6 flex items-center gap-2 text-slate-500 font-semibold hover:text-red-600 transition cursor-pointer">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  )}
                </div>
              </div>
              )}
            </div>
          )}
        </section>

        <aside className="hidden lg:sticky lg:top-[92px] lg:block lg:h-fit lg:border-l lg:border-slate-200 lg:pl-4">
          <div className="soft-card p-4">
            <p className="px-2 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">Trending Issues</p>
            <div className="mt-3 space-y-2">
              {trendingPosts.slice(0, 6).map((post, index) => (
                <button
                  key={`${post.id}-trend-rail`}
                  type="button"
                  onClick={() => {
                    setActivePostId(post.id);
                    setActiveView('post');
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition hover:bg-slate-100"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">#{index + 1} Trending</p>
                  <p className="mt-1 text-[15px] font-semibold leading-5 text-slate-900">{post.title}</p>
                  <p className="mt-1.5 text-sm text-slate-500">{formatCount(post.support)} supports</p>
                </button>
              ))}
              {trendingPosts.length === 0 && (
                <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                  No trending issues yet.
                </p>
              )}
            </div>
          </div>
        </aside>

      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold ${
                  activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ProfileView({
  isOwnProfile,
  profileDisplay,
  profileInitials,
  profileBio,
  profileBeat,
  profileLocation,
  profileJoinLabel,
  profileCommunitiesCount,
  profileImpactScore,
  profileFollowersCount,
  profileFollowingCount,
  profilePosts,
  profileSolutions,
  profileActivityFeed,
  profileTab,
  profileShareFeedback,
  viewedProfilePhotoUrl,
  isFollowingViewedProfile,
  latestProfilePost,
  profileTopLocations,
  onSelectTab,
  onEditPhoto,
  onCreateReport,
  onToggleTheme,
  onToggleFollow,
  onShareProfile,
  onOpenLatestPost,
  onOpenPost,
  onLogout,
}) {
  return (
    <>
      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.32)]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.94))] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                {profileDisplay.role}
              </span>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                {profileBeat}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {Math.max(profileCommunitiesCount, 1)} communities
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Signal score</p>
              <p className="mt-1 font-display text-3xl font-bold text-slate-950">{profileImpactScore}%</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {viewedProfilePhotoUrl ? (
                <img
                  src={viewedProfilePhotoUrl}
                  alt={`${profileDisplay.username} profile`}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_16px_34px_-26px_rgba(15,23,42,0.32)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-4xl font-bold uppercase text-white shadow-[0_16px_34px_-26px_rgba(15,23,42,0.32)]">
                  {profileInitials}
                </div>
              )}

              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[34px] font-bold leading-tight text-slate-950">{profileDisplay.username}</h2>
                  {profileDisplay.reputation >= 600 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Trusted reporter
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-500">@{profileDisplay.username.toLowerCase()}</p>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{profileBio}</p>
                <div className="mt-4 flex flex-wrap gap-2.5 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    {profileLocation}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    <CalendarDays className="h-4 w-4 text-blue-600" />
                    Joined {profileJoinLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                    <Globe className="h-4 w-4 text-blue-600" />
                    {profileTopLocations[0] || profileLocation}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 xl:justify-end">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={onEditPhoto}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Edit photo
                  </button>
                  <button
                    type="button"
                    onClick={onCreateReport}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <SquarePen className="h-4 w-4" />
                    New report
                  </button>
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Switch theme
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      isFollowingViewedProfile
                        ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isFollowingViewedProfile ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isFollowingViewedProfile ? 'Following' : 'Follow'}
                  </button>
                  <button
                    type="button"
                    onClick={onShareProfile}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Share2 className="h-4 w-4" />
                    {profileShareFeedback || 'Share profile'}
                  </button>
                  {latestProfilePost && (
                    <button
                      type="button"
                      onClick={onOpenLatestPost}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Latest report
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:px-7 md:grid-cols-2 xl:grid-cols-5">
          <ProfileStatPill icon={<Users className="h-4 w-4" />} label="Followers" value={formatCount(profileFollowersCount)} hint="Tracking this profile" />
          <ProfileStatPill icon={<UserPlus className="h-4 w-4" />} label="Following" value={formatCount(profileFollowingCount)} hint="Accounts in orbit" />
          <ProfileStatPill icon={<Bookmark className="h-4 w-4" />} label="Reports" value={formatCount(profileDisplay.postsCount)} hint="Published threads" />
          <ProfileStatPill icon={<Lightbulb className="h-4 w-4" />} label="Solutions" value={formatCount(profileDisplay.solutionsProposed)} hint="Idea drops" />
          <ProfileStatPill icon={<Zap className="h-4 w-4" />} label="Reputation" value={formatCount(profileDisplay.reputation)} hint="Community-earned signal" />
        </div>
      </div>

      <div className="space-y-5">
          <div className="soft-card p-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { id: 'reports', label: 'Reports', count: profilePosts.length },
                { id: 'solutions', label: 'Solutions', count: profileSolutions.length },
                { id: 'activity', label: 'Activity', count: profileActivityFeed.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  className={`rounded-xl px-4 py-3 text-left transition ${
                    profileTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${profileTab === tab.id ? 'text-white/65' : 'text-slate-400'}`}>
                    {tab.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold">{formatCount(tab.count)}</p>
                </button>
              ))}
            </div>
          </div>

          {profileTab === 'reports' && (
            <div className="space-y-4">
              {profilePosts.map((post) => (
                <ProfileReportCard
                  key={`${post.id}-profile-card`}
                  post={post}
                  onOpenPost={() => onOpenPost(post.id)}
                />
              ))}
              {profilePosts.length === 0 && (
                <EmptyProfilePanel
                  icon={<Bookmark className="h-5 w-5" />}
                  title="No reports yet"
                  description={`${profileDisplay.username} has not published a report yet. The profile header and stats will grow as new posts land.`}
                />
              )}
            </div>
          )}

          {profileTab === 'solutions' && (
            <div className="space-y-4">
              {profileSolutions.map((solution) => (
                <ProfileSolutionCard
                  key={`${solution.postId}-${solution.solutionIndex}-${solution.key}`}
                  solution={solution}
                  onOpenPost={() => onOpenPost(solution.postId)}
                />
              ))}
              {profileSolutions.length === 0 && (
                <EmptyProfilePanel
                  icon={<Lightbulb className="h-5 w-5" />}
                  title="No solutions posted yet"
                  description="This profile has not added a community solution yet. Suggested fixes and threaded replies will show up here."
                />
              )}
            </div>
          )}

          {profileTab === 'activity' && (
            <div className="space-y-4">
              {profileActivityFeed.map((activity) => (
                <ProfileActivityCard
                  key={activity.id}
                  activity={activity}
                  onOpenPost={() => onOpenPost(activity.postId)}
                />
              ))}
              {profileActivityFeed.length === 0 && (
                <EmptyProfilePanel
                  icon={<Activity className="h-5 w-5" />}
                  title="No activity yet"
                  description="New reports, solutions, and social momentum will stack here as the profile becomes more active."
                />
              )}
            </div>
          )}

          {isOwnProfile && (
            <div className="soft-card p-5">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
      </div>
    </>
  );
}

function ProfileStatPill({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.9)]">
          {icon}
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </div>
  );
}

function ProfileActivityCard({ activity, onOpenPost }) {
  const isReport = activity.kind === 'report';

  return (
    <article className="soft-card overflow-hidden p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isReport ? 'text-blue-700' : 'text-amber-700'}`}>
            {activity.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-[26px] font-bold leading-tight text-slate-950">{activity.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{activity.preview}</p>
        </div>

        <button
          type="button"
          onClick={onOpenPost}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Open
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
        {activity.chips.map((chip) => (
          <span key={`${activity.id}-${chip}`} className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600">
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {activity.metrics.map((metric) => (
          <div key={`${activity.id}-${metric.label}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{metric.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function BookmarkedPostCard({ post, onOpenPost, onOpenAuthor, onToggleSave }) {
  const { previewText } = getDescriptionPreview(post.description, false, 160);

  return (
    <article className="soft-card p-5 transition hover:shadow-[0_16px_38px_-28px_rgba(15,23,42,0.38)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpenAuthor}
          className="flex items-center gap-3 rounded-xl text-left"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white">
            {getInitials(post.author)}
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">{post.author}</p>
            <p className="text-xs text-slate-500">{post.time || 'Recently'}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onToggleSave}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          <Bookmark className="h-4 w-4 fill-current" />
          Remove
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700">
          <MapPin className="h-3.5 w-3.5" />
          {post.location}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">
          <Building2 className="h-3.5 w-3.5" />
          {post.department}
        </span>
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-slate-500">
          Saved to your library
        </span>
      </div>

      <div className="mt-4">
        <h3 className="font-display text-[26px] font-bold leading-tight text-slate-950">{post.title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{previewText}</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Support</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.support)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Solutions</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.solutions)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Comments</p>
            <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.comments)}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPost}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
        >
          Open thread
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {post.fixes?.[0] && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Top fix</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
            {post.fixes[0]}
          </p>
        </div>
      )}
    </article>
  );
}

function ProfileReportCard({ post, onOpenPost }) {
  const { previewText } = getDescriptionPreview(post.description, false, 170);

  return (
    <article className="soft-card overflow-hidden p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700">
              <MapPin className="h-3.5 w-3.5" />
              {post.location}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600">
              <Building2 className="h-3.5 w-3.5" />
              {post.department}
            </span>
            {post.verified && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-[26px] font-bold leading-tight text-slate-950">{post.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{previewText}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{post.time || 'Recently'}</p>
        </div>

        <button
          type="button"
          onClick={onOpenPost}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Open thread
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Support</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.support)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Solutions</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.solutions)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Comments</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.comments)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Shares</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(post.shares)}</p>
        </div>
      </div>
    </article>
  );
}

function ProfileSolutionCard({ solution, onOpenPost }) {
  return (
    <article className="soft-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">Solution on {solution.postDepartment}</p>
          <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">{solution.postTitle}</h3>
          <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700">
            {solution.text}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{formatTimestamp(solution.createdAt)}</p>
        </div>
        <button
          type="button"
          onClick={onOpenPost}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          View post
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          Score {formatCount(solution.score)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          <MessageCircle className="h-4 w-4 text-blue-600" />
          Replies {formatCount(solution.replyCount)}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
          <MapPin className="h-4 w-4 text-blue-600" />
          {solution.postLocation}
        </span>
      </div>
    </article>
  );
}

function EmptyProfilePanel({ icon, title, description }) {
  return (
    <div className="soft-card p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-2xl font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function MetricBox({ label, value, dark = true }) {
  return (
    <div className={`${dark ? 'glass-panel text-white' : 'rounded-xl border border-slate-200 bg-slate-50 text-slate-900'} px-4 py-4`}>
      <p className={`text-xs font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1.5 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function toCount(value) {
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
}

function formatCount(value) {
  const numeric = toCount(value);
  if (numeric >= 1000000) return `${(numeric / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${numeric}`;
}

function resolveMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  return `${API_BASE_URL}${url}`;
}

function buildMediaQualityOptions(media, fallbackUrl) {
  const options = [];
  const seen = new Set();

  const appendOption = (label, url, value = label.toLowerCase()) => {
    const normalizedUrl = resolveMediaUrl(url);
    if (!normalizedUrl) return;
    const key = `${label}|${normalizedUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ label, url: normalizedUrl, value });
  };

  if (Array.isArray(media?.sources) && media.sources.length > 0) {
    media.sources.forEach((source, index) => {
      const label = `${source?.label ?? source?.quality ?? `Source ${index + 1}`}`.trim();
      appendOption(label, source?.url, `${label.toLowerCase()}-${index}`);
    });
  } else if (media?.qualities && typeof media.qualities === 'object') {
    Object.entries(media.qualities).forEach(([qualityLabel, qualityUrl]) => {
      appendOption(`${qualityLabel}`, qualityUrl, `${qualityLabel}`.toLowerCase());
    });
  }

  // If we still have no options, use the fallback provided but don't fake other qualities.
  if (options.length === 0) {
    appendOption('Auto', fallbackUrl, 'auto');
  } else if (!options.some((option) => option.value === 'auto')) {
    // If we have specific qualities from the backend, add an "Auto" option that points 
    // to the highest quality (fallbackUrl) for convenience.
    appendOption('Auto', fallbackUrl, 'auto');
  }

  return options;
}

function formatMediaTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const wholeSeconds = Math.floor(seconds);
  const mins = Math.floor(wholeSeconds / 60);
  const secs = wholeSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function EnhancedVideoPlayer({ src, title, qualityOptions = [] }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState(() => qualityOptions?.[0]?.value ?? 'auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sourceOptions = qualityOptions?.length > 0 ? qualityOptions : [{ label: 'Auto', value: 'auto', url: src }];
  const activeQualityOption = sourceOptions.find((option) => option.value === selectedQuality) ?? sourceOptions[0];
  const activeSource = activeQualityOption?.url || src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlayState = () => setIsPlaying(!video.paused && !video.ended);
    const syncTime = () => setCurrentTime(video.currentTime || 0);
    const syncDuration = () => setDuration(video.duration || 0);
    const syncVolume = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };

    video.addEventListener('play', syncPlayState);
    video.addEventListener('pause', syncPlayState);
    video.addEventListener('ended', syncPlayState);
    video.addEventListener('timeupdate', syncTime);
    video.addEventListener('loadedmetadata', syncDuration);
    video.addEventListener('durationchange', syncDuration);
    video.addEventListener('volumechange', syncVolume);

    syncPlayState();
    syncTime();
    syncDuration();
    syncVolume();

    return () => {
      video.removeEventListener('play', syncPlayState);
      video.removeEventListener('pause', syncPlayState);
      video.removeEventListener('ended', syncPlayState);
      video.removeEventListener('timeupdate', syncTime);
      video.removeEventListener('loadedmetadata', syncDuration);
      video.removeEventListener('durationchange', syncDuration);
      video.removeEventListener('volumechange', syncVolume);
    };
  }, [activeSource]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const onSeek = (event) => {
    const nextTime = Number(event.target.value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextTime)) return;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const onVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(nextVolume)) return;
    video.volume = nextVolume;
    video.muted = nextVolume === 0;
    setVolume(nextVolume);
    setIsMuted(video.muted);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const onChangePlaybackRate = (nextRate) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const onChangeQuality = (qualityValue) => {
    const video = videoRef.current;
    const nextOption = sourceOptions.find((option) => option.value === qualityValue);
    if (!video || !nextOption) return;

    // Don't do anything if the source URL is actually the same to avoid unnecessary reload.
    if (nextOption.url === activeSource) {
      setSelectedQuality(qualityValue);
      setIsSettingsOpen(false);
      return;
    }

    const previousTime = video.currentTime || 0;
    const wasPlaying = !video.paused;

    setSelectedQuality(qualityValue);
    setIsSettingsOpen(false);

    // We use a one-time event listener for 'loadedmetadata' to ensure the video has 
    // initialized the new source before we attempt a seek.
    const onMetadataLoaded = () => {
      const updatedVideo = videoRef.current;
      if (!updatedVideo) return;
      const resumeAt = Math.min(previousTime, updatedVideo.duration || previousTime || 0);
      if (Number.isFinite(resumeAt)) updatedVideo.currentTime = resumeAt;
      if (wasPlaying) updatedVideo.play().catch(() => {});
      video.removeEventListener('loadedmetadata', onMetadataLoaded);
    };

    video.addEventListener('loadedmetadata', onMetadataLoaded);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      await document.exitFullscreen().catch(() => {});
      return;
    }

    if (container.requestFullscreen) {
      await container.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={activeSource || src}
        className="h-full w-full object-contain bg-black"
        preload="metadata"
        playsInline
        onClick={togglePlayPause}
      />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(2,6,23,0.06)_35%,_rgba(2,6,23,0.86)_100%)]" />

      <div className="absolute right-3 top-3 z-20">
        <button
          type="button"
          onClick={() => setIsSettingsOpen((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 text-white backdrop-blur"
          aria-label="Open video settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {isSettingsOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900/95 p-2 text-white shadow-xl">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Quality</p>
            {sourceOptions.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                onClick={() => onChangeQuality(option.value)}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${
                  selectedQuality === option.value ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{option.label}</span>
                {selectedQuality === option.value && <span className="text-[11px] uppercase">Active</span>}
              </button>
            ))}

            <p className="mt-2 px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Speed</p>
            <div className="grid grid-cols-4 gap-1 px-1 pb-1">
              {[0.75, 1, 1.25, 1.5].map((speed) => (
                <button
                  key={`${speed}x`}
                  type="button"
                  onClick={() => onChangePlaybackRate(speed)}
                  className={`rounded-md px-1 py-1 text-xs font-semibold ${
                    playbackRate === speed ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 p-3">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onChange={onSeek}
          className="w-full accent-blue-500"
          aria-label={`Seek video ${title}`}
        />

        <div className="mt-2 flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={togglePlayPause}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={onVolumeChange}
            className="w-20 accent-blue-500"
            aria-label="Adjust volume"
          />

          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/35 bg-slate-900/55 px-2 py-1 backdrop-blur">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300">Q</span>
            <select
              value={activeQualityOption?.value ?? 'auto'}
              onChange={(event) => onChangeQuality(event.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none"
              aria-label="Select video quality"
            >
              {sourceOptions.map((option) => (
                <option key={`bar-${option.value}`} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="ml-auto text-xs font-semibold text-slate-200">
            {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
          </p>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function getDescriptionPreview(description, isExpanded, previewLength = 190) {
  const text = `${description ?? ''}`.trim();
  if (isExpanded || text.length <= previewLength) {
    return { previewText: text, isTruncated: false };
  }

  const truncated = text.slice(0, previewLength).trimEnd();
  return { previewText: `${truncated}...`, isTruncated: true };
}

function getTrendingScore(post) {
  const support = toCount(post?.support);
  const comments = toCount(post?.comments);
  const shares = toCount(post?.shares);
  return (support * 3) + (comments * 2) + shares;
}

function normalizeDiscussionEntry(entry, index, path = []) {
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

  const upvoters = Array.isArray(entry?.upvoters) ? entry.upvoters.filter(Boolean) : [];
  const downvoters = Array.isArray(entry?.downvoters) ? entry.downvoters.filter(Boolean) : [];
  const replies = (Array.isArray(entry?.replies) ? entry.replies : [])
    .map((reply, replyIndex) => normalizeDiscussionEntry(reply, index, [...path, replyIndex]))
    .filter(Boolean);

  return {
    author: `${entry?.author ?? 'Community member'}`.trim() || 'Community member',
    text,
    createdAt: entry?.createdAt ?? null,
    upvoters,
    downvoters,
    score: typeof entry?.score === 'number' ? entry.score : upvoters.length - downvoters.length,
    replies,
    replyCount: typeof entry?.replyCount === 'number' ? entry.replyCount : replies.length,
    path,
    sourceIndex: Number.isInteger(entry?.sourceIndex) ? entry.sourceIndex : index,
    key: entry?.key || `${entry?.author ?? 'community'}-${entry?.createdAt ?? index}-${index}`,
  };
}

function normalizeSolutionEntry(entry, index) {
  return normalizeDiscussionEntry(entry, index, []);
}

function getSolutionStateKey(postId, solutionIndex, replyPath = []) {
  return `${postId}:${solutionIndex}:${replyPath.join('.')}`;
}

function getInitials(value, maxLength = 2) {
  const text = `${value ?? ''}`.trim();
  if (!text) return 'PP';

  const parts = text.split(/\s+|_/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return text.slice(0, maxLength).toUpperCase();
}

function getSolutionVoteForUser(solution, username) {
  if (!username || !solution) return null;
  if (Array.isArray(solution.upvoters) && solution.upvoters.includes(username)) return 'up';
  if (Array.isArray(solution.downvoters) && solution.downvoters.includes(username)) return 'down';
  return null;
}

function getPostSolutions(post) {
  if (!post) return [];

  const normalizedSolutions = (Array.isArray(post.solutionsList) ? post.solutionsList : [])
    .map(normalizeSolutionEntry)
    .filter(Boolean);

  if (normalizedSolutions.length > 0) {
    return [...normalizedSolutions].reverse();
  }

  const fallbackFixes = (Array.isArray(post.fixes) ? post.fixes : [])
    .map((fix, index) => {
      const text = `${fix ?? ''}`.trim();
      if (!text || text.toLowerCase() === 'awaiting suggested fixes') return null;
      return {
        author: 'Community member',
        text,
        createdAt: null,
        upvoters: [],
        downvoters: [],
        score: 0,
        replies: [],
        replyCount: 0,
        sourceIndex: index,
        key: `fix-${index}`,
        isFallback: true,
      };
    })
    .filter(Boolean);

  return fallbackFixes;
}

function formatTimestamp(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getMostFrequentValue(values) {
  const counts = values
    .map((value) => `${value ?? ''}`.trim())
    .filter(Boolean)
    .reduce((accumulator, value) => {
      accumulator.set(value, (accumulator.get(value) ?? 0) + 1);
      return accumulator;
    }, new Map());

  let topValue = '';
  let topCount = 0;
  counts.forEach((count, value) => {
    if (count > topCount) {
      topValue = value;
      topCount = count;
    }
  });

  return topValue;
}

function collectSolutionsByAuthor(posts, username) {
  const normalizedUsername = `${username ?? ''}`.trim();
  if (!normalizedUsername) return [];

  return posts.flatMap((post) =>
    getPostSolutions(post)
      .map((solution, solutionIndex) => ({
        ...solution,
        postId: post.id,
        postTitle: post.title,
        postLocation: post.location,
        postDepartment: post.department,
        solutionIndex,
      }))
      .filter((solution) => solution.author === normalizedUsername)
  );
}

function buildProfileActivityFeed(profilePosts, profileSolutions) {
  const reportFeed = profilePosts.map((post, index) => ({
    id: `feed-report-${post.id}`,
    kind: 'report',
    postId: post.id,
    eyebrow: 'Report thread',
    title: post.title,
    preview: getDescriptionPreview(post.description, false, 180).previewText,
    chips: [post.location, post.department, post.time || 'Recently'].filter(Boolean),
    metrics: [
      { label: 'Support', value: formatCount(post.support) },
      { label: 'Comments', value: formatCount(post.comments) },
      { label: 'Shares', value: formatCount(post.shares) },
    ],
    sortValue: 4000 - index,
  }));

  const solutionFeed = profileSolutions.map((solution, index) => ({
    id: `feed-solution-${solution.postId}-${solution.solutionIndex}-${solution.key}`,
    kind: 'solution',
    postId: solution.postId,
    eyebrow: 'Community solution',
    title: solution.postTitle,
    preview: `${solution.text}`.trim(),
    chips: [solution.postDepartment, solution.postLocation, formatTimestamp(solution.createdAt)].filter(Boolean),
    metrics: [
      { label: 'Score', value: formatCount(solution.score) },
      { label: 'Replies', value: formatCount(solution.replyCount) },
      { label: 'Post', value: 'Open thread' },
    ],
    sortValue: 3000 - index,
  }));

  return [...reportFeed, ...solutionFeed].sort((a, b) => b.sortValue - a.sortValue);
}

function getProfileJoinLabel(username) {
  const normalized = `${username ?? ''}`.trim().toLowerCase();
  if (!normalized) return 'recently';

  const total = [...normalized].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const year = 2022 + (total % 4);
  const monthIndex = total % 12;
  const labelDate = new Date(Date.UTC(year, monthIndex, 1));

  return labelDate.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default App;

