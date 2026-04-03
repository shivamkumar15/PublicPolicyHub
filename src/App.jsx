import { useEffect, useId, useRef, useState } from 'react';
import Activity from 'lucide-react/dist/esm/icons/activity.js';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left.js';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right.js';
import BadgeCheck from 'lucide-react/dist/esm/icons/badge-check.js';
import Bell from 'lucide-react/dist/esm/icons/bell.js';
import Bookmark from 'lucide-react/dist/esm/icons/bookmark.js';
import Building2 from 'lucide-react/dist/esm/icons/building-2.js';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days.js';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left.js';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.js';
import Flag from 'lucide-react/dist/esm/icons/flag.js';
import Globe from 'lucide-react/dist/esm/icons/globe.js';
import House from 'lucide-react/dist/esm/icons/house.js';
import ImageIcon from 'lucide-react/dist/esm/icons/image.js';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb.js';
import LogOut from 'lucide-react/dist/esm/icons/log-out.js';
import MapPin from 'lucide-react/dist/esm/icons/map-pin.js';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2.js';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle.js';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal.js';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2.js';
import Pause from 'lucide-react/dist/esm/icons/pause.js';
import Play from 'lucide-react/dist/esm/icons/play.js';
import Search from 'lucide-react/dist/esm/icons/search.js';
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
import PageLoader from './PageLoader.jsx';
import SearchInput from './SearchInput.jsx';
import {
  auth,
  getRedirectResult,
  provider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
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

const defaultNotifications = [];

const THEME_STORAGE_KEY = 'pph-theme';
const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];
const GOOGLE_AUTH_MODE_STORAGE_KEY = 'pph-google-auth-mode';

function buildAppHash({
  view = 'home',
  postId = '',
  profileUsername = '',
  profileTab = 'reports',
  profileModal = '',
  profileSettingsSection = 'personal',
  connectionType = 'followers',
} = {}) {
  if (view === 'post' && postId) return `#/post/${encodeURIComponent(postId)}`;

  if (view === 'profile' && profileUsername) {
    const params = new URLSearchParams();
    if (profileTab && profileTab !== 'reports') params.set('tab', profileTab);

    if (profileModal === 'settings') {
      params.set('modal', 'settings');
      params.set('section', profileSettingsSection || 'personal');
    }

    if (profileModal === 'connections') {
      params.set('modal', 'connections');
      params.set('type', connectionType === 'following' ? 'following' : 'followers');
    }

    const queryString = params.toString();
    return `#/profile/${encodeURIComponent(profileUsername)}${queryString ? `?${queryString}` : ''}`;
  }

  if (view === 'create') return '#/create';
  if (view === 'bookmarks') return '#/bookmarks';
  if (view === 'alerts') return '#/alerts';
  if (view === 'auth') return '#/auth';
  return '#/home';
}

function parseAppHash(hashValue) {
  const defaultRoute = {
    view: 'home',
    postId: '',
    profileUsername: '',
    profileTab: 'reports',
    profileModal: '',
    profileSettingsSection: 'personal',
    connectionType: 'followers',
  };

  const rawHash = `${hashValue ?? ''}`.trim();
  if (!rawHash || rawHash === '#') {
    return defaultRoute;
  }

  const normalizedHash = rawHash.startsWith('#/')
    ? rawHash.slice(2)
    : rawHash.replace(/^#/, '');

  if (!normalizedHash || normalizedHash === 'home') {
    return defaultRoute;
  }

  if (normalizedHash.startsWith('post/')) {
    const [pathPart] = normalizedHash.split('?');
    const postId = decodeURIComponent(pathPart.slice(5));
    return postId ? { ...defaultRoute, view: 'post', postId } : defaultRoute;
  }

  if (normalizedHash.startsWith('profile/')) {
    const [pathPart, queryString = ''] = normalizedHash.split('?');
    const profileUsername = decodeURIComponent(pathPart.slice(8));
    if (!profileUsername) return defaultRoute;

    const params = new URLSearchParams(queryString);
    const nextProfileTab = ['reports', 'solutions', 'activity'].includes(params.get('tab') || '')
      ? params.get('tab')
      : 'reports';
    const nextModal = params.get('modal') === 'settings' || params.get('modal') === 'connections'
      ? params.get('modal')
      : '';
    const nextSection = ['personal', 'change-password', 'switch-account', 'logout'].includes(params.get('section') || '')
      ? params.get('section')
      : 'personal';
    const nextConnectionType = params.get('type') === 'following' ? 'following' : 'followers';

    return {
      ...defaultRoute,
      view: 'profile',
      profileUsername,
      profileTab: nextProfileTab,
      profileModal: nextModal,
      profileSettingsSection: nextSection,
      connectionType: nextConnectionType,
    };
  }

  if (normalizedHash.startsWith('post-')) {
    return {
      ...defaultRoute,
      view: 'post',
      postId: decodeURIComponent(normalizedHash.slice(5)),
    };
  }

  if (normalizedHash.startsWith('profile-')) {
    return {
      ...defaultRoute,
      view: 'profile',
      profileUsername: decodeURIComponent(normalizedHash.slice(8)),
    };
  }

  if (normalizedHash === 'create' || normalizedHash === 'report') {
    return { ...defaultRoute, view: 'create' };
  }

  if (normalizedHash === 'bookmarks') {
    return { ...defaultRoute, view: 'bookmarks' };
  }

  if (normalizedHash === 'alerts') {
    return { ...defaultRoute, view: 'alerts' };
  }

  if (normalizedHash === 'auth') {
    return { ...defaultRoute, view: 'auth' };
  }

  return defaultRoute;
}

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
  const [isPostSubmitting, setIsPostSubmitting] = useState(false);
  const [postUploadProgress, setPostUploadProgress] = useState(0);
  const [postUploadStatus, setPostUploadStatus] = useState('idle');
  const [postUploadFeedback, setPostUploadFeedback] = useState('');
  const [isGenderPromptOpen, setIsGenderPromptOpen] = useState(false);
  const [isGenderPromptDismissed, setIsGenderPromptDismissed] = useState(false);
  const [genderPromptValue, setGenderPromptValue] = useState('');
  const [genderPromptError, setGenderPromptError] = useState('');
  const [isGenderPromptSubmitting, setIsGenderPromptSubmitting] = useState(false);
  const [mediaSlideIndexByPost, setMediaSlideIndexByPost] = useState({});
  const [solutionInputsByPost, setSolutionInputsByPost] = useState({});
  const [solutionReplyInputsByKey, setSolutionReplyInputsByKey] = useState({});
  const [visibleRepliesByKey, setVisibleRepliesByKey] = useState({});
  const [activeReplyComposerByKey, setActiveReplyComposerByKey] = useState({});
  const [expandedDescriptionByPost, setExpandedDescriptionByPost] = useState({});
  const [isActionSubmittingByPost, setIsActionSubmittingByPost] = useState({});
  const [isSolutionActionSubmittingByKey, setIsSolutionActionSubmittingByKey] = useState({});
  const [activePostMenuId, setActivePostMenuId] = useState(null);
  const [activeAuthorHoverCard, setActiveAuthorHoverCard] = useState('');
  const [authorPreviewByUsername, setAuthorPreviewByUsername] = useState({});
  const [isFollowSubmittingByUsername, setIsFollowSubmittingByUsername] = useState({});
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileViewUsername, setProfileViewUsername] = useState(null);
  const [viewedProfileMeta, setViewedProfileMeta] = useState(null);
  const [aiSummaryByPost, setAiSummaryByPost] = useState({});
  const [aiSummaryStatusByPost, setAiSummaryStatusByPost] = useState({});
  const [profileTab, setProfileTab] = useState('reports');
  const [profileConnectionsState, setProfileConnectionsState] = useState({
    open: false,
    type: 'followers',
    username: '',
    status: 'idle',
    items: [],
    error: '',
  });
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileShareFeedback, setProfileShareFeedback] = useState('');
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [profileSettingsSection, setProfileSettingsSection] = useState('personal');
  const [profileSettingsStatus, setProfileSettingsStatus] = useState({ type: '', message: '' });
  const [isProfileSettingsSubmitting, setIsProfileSettingsSubmitting] = useState(false);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileUsernameDraft, setProfileUsernameDraft] = useState('');
  const [profilePasswordDraft, setProfilePasswordDraft] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [theme, setTheme] = useState(getInitialTheme);
  const searchPanelRef = useRef(null);
  const mobileSearchPanelRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const solutionInputRefs = useRef({});
  const solutionReplyInputRefs = useRef({});
  const mediaScrollerRefs = useRef({});
  const postMenuRefs = useRef({});
  const authorPreviewStatusRef = useRef({});
  const phoneRecaptchaVerifierRef = useRef(null);
  const phoneConfirmationResultRef = useRef(null);
  const routeSyncRef = useRef({ initialized: false, skipNextPush: false });
  const authStateRef = useRef({ hasUser: false, token: null });
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

  const resetPostUploadState = () => {
    setIsPostSubmitting(false);
    setPostUploadProgress(0);
    setPostUploadStatus('idle');
    setPostUploadFeedback('');
  };

  const setMediaScrollerRef = (postId, element) => {
    if (!postId) return;
    if (element) {
      mediaScrollerRefs.current[postId] = element;
      return;
    }
    delete mediaScrollerRefs.current[postId];
  };

  const setPostMenuRef = (postId, element) => {
    if (!postId) return;
    if (element) {
      postMenuRefs.current[postId] = element;
      return;
    }
    delete postMenuRefs.current[postId];
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

  const normalizeNotification = (notification, index = 0) => {
    if (typeof notification === 'string') {
      return {
        id: `legacy-notification-${index}`,
        type: 'generic',
        message: notification,
        actorUsername: '',
        recipientUsername: '',
        postId: '',
        postTitle: '',
        createdAt: null,
        read: false,
      };
    }

    return {
      id: `${notification?.id ?? notification?._id ?? `notification-${index}`}`,
      type: `${notification?.type ?? 'generic'}`.trim() || 'generic',
      message: `${notification?.message ?? ''}`.trim(),
      actorUsername: `${notification?.actorUsername ?? ''}`.trim(),
      recipientUsername: `${notification?.recipientUsername ?? ''}`.trim(),
      postId: `${notification?.postId ?? ''}`.trim(),
      postTitle: `${notification?.postTitle ?? ''}`.trim(),
      createdAt: notification?.createdAt ?? notification?.created_at ?? null,
      read: !!notification?.read,
    };
  };

  const upsertPostInState = (incomingPost) => {
    const normalizedIncoming = normalizePost(incomingPost);
    setApiPosts((currentPosts) => {
      const existingIndex = currentPosts.findIndex((post) => post.id === normalizedIncoming.id);
      if (existingIndex === -1) return [normalizedIncoming, ...currentPosts];

      const nextPosts = [...currentPosts];
      nextPosts[existingIndex] = normalizedIncoming;
      return nextPosts;
    });
    setAiSummaryByPost((current) => {
      if (!(normalizedIncoming.id in current)) return current;
      const next = { ...current };
      delete next[normalizedIncoming.id];
      return next;
    });
    setAiSummaryStatusByPost((current) => {
      if (!(normalizedIncoming.id in current)) return current;
      const next = { ...current };
      delete next[normalizedIncoming.id];
      return next;
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
    setAiSummaryByPost((current) => {
      if (!(postId in current)) return current;
      const next = { ...current };
      delete next[postId];
      return next;
    });
    setAiSummaryStatusByPost((current) => {
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
    setIsProfileSettingsOpen(false);
    setProfileViewUsername(null);
    setActiveView('auth');
  };

  const ensureAuthenticated = () => {
    if (token && userProfile) return true;
    openAuthPage();
    return false;
  };

  const fetchPublicData = (currentToken = token) => {
    const notificationHeaders = currentToken ? { Authorization: `Bearer ${currentToken}` } : {};

    return Promise.all([
      fetch(`${API_BASE_URL}/api/posts`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/notifications`, { headers: notificationHeaders }).then(res => res.json())
    ])
      .then(([postsData, notifsData]) => {
        if (Array.isArray(postsData)) {
          const normalizedPosts = postsData.map(normalizePost);
          setApiPosts(normalizedPosts);
        }
        if (Array.isArray(notifsData)) {
          setApiNotifications(notifsData.map(normalizeNotification).filter((item) => item.message));
        }
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
    fetchPublicData(token)
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
            firebaseSignOut(auth).catch(() => { });
            localStorage.removeItem('token');
            setToken(null);
            setUserProfile(null);
          });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (activeView !== 'alerts') return;

    fetchPublicData(token).catch(console.error);
  }, [activeView, token]);

  useEffect(() => {
    authStateRef.current = {
      hasUser: !!userProfile,
      token,
    };
  }, [token, userProfile]);

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
    let isCancelled = false;

    const finalizeRedirectLogin = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (isCancelled || !result?.user) return;

        setIsAuthSubmitting(true);
        setAuthError('');

        const redirectMode = getStoredGoogleAuthMode();
        clearStoredGoogleAuthMode();

        await finalizeFirebaseAuth({
          firebaseUser: result.user,
          mode: redirectMode,
          preferredDisplayName: result.user.displayName,
          signupProfile: null,
        });
      } catch (error) {
        if (isCancelled) return;
        clearStoredGoogleAuthMode();
        firebaseSignOut(auth).catch(() => { });
        setAuthError(getGoogleAuthErrorMessage(error));
        setActiveView('auth');
      } finally {
        if (!isCancelled) {
          setIsAuthSubmitting(false);
        }
      }
    };

    finalizeRedirectLogin();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userProfile?.username) {
      setIsGenderPromptOpen(false);
      setIsGenderPromptDismissed(false);
      setGenderPromptValue('');
      setGenderPromptError('');
      setIsGenderPromptSubmitting(false);
      return;
    }

    if (userProfile.gender) {
      setIsGenderPromptOpen(false);
      setIsGenderPromptDismissed(false);
      setGenderPromptValue(userProfile.gender);
      setGenderPromptError('');
      setIsGenderPromptSubmitting(false);
      return;
    }

    if (!isGenderPromptDismissed) {
      setIsGenderPromptOpen(true);
    }
  }, [isGenderPromptDismissed, userProfile?.gender, userProfile?.username]);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event) => {
      const isInsideDesktopSearch = searchPanelRef.current?.contains(event.target);
      const isInsideMobileSearch = mobileSearchPanelRef.current?.contains(event.target);

      if (!isInsideDesktopSearch && !isInsideMobileSearch) {
        setIsSearchOpen(false);
      }

      if (activePostMenuId) {
        const activePostMenuElement = postMenuRefs.current[activePostMenuId];
        if (activePostMenuElement && !activePostMenuElement.contains(event.target)) {
          setActivePostMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeMenuOnOutsideClick);
  }, [activePostMenuId]);

  useEffect(() => {
    if (!userProfile) {
      setIsProfileSettingsOpen(false);
      setProfileSettingsStatus({ type: '', message: '' });
      setProfileNameDraft('');
      setProfileUsernameDraft('');
      setProfilePasswordDraft({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      return;
    }

    setProfileNameDraft(userProfile.displayName || '');
    setProfileUsernameDraft(userProfile.username || '');
  }, [userProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const applyBrowserRoute = () => {
      const route = parseAppHash(window.location.hash);
      const authState = authStateRef.current;
      routeSyncRef.current.skipNextPush = true;
      setIsProfileSettingsOpen(false);
      setIsSearchOpen(false);

      if (route.view === 'post' && route.postId) {
        closeProfileConnections();
        setProfileViewUsername(null);
        setActivePostId(route.postId);
        setActiveView('post');
        return;
      }

      if (route.view === 'profile' && route.profileUsername) {
        setProfileViewUsername(route.profileUsername);
        setProfileTab(route.profileTab);
        setActivePostId(null);
        setActiveView('profile');

        if (route.profileModal === 'settings') {
          closeProfileConnections();
          setProfileSettingsSection(route.profileSettingsSection);
          setProfileSettingsStatus({ type: '', message: '' });
          setIsProfileSettingsOpen(true);
        } else {
          setIsProfileSettingsOpen(false);
        }

        if (route.profileModal === 'connections') {
          setIsProfileSettingsOpen(false);
          openProfileConnectionsPanel(route.connectionType, route.profileUsername);
        } else {
          closeProfileConnections();
        }
        return;
      }

      if ((route.view === 'create' || route.view === 'bookmarks') && !authState.hasUser && !authState.token) {
        closeProfileConnections();
        setProfileViewUsername(null);
        setActivePostId(null);
        setActiveView('auth');
        return;
      }

      closeProfileConnections();
      setProfileViewUsername(null);
      setActivePostId(null);
      setActiveView(route.view);
    };

    applyBrowserRoute();
    window.history.replaceState(
      { route: window.location.hash || '#/home' },
      '',
      `${window.location.pathname}${window.location.search}${window.location.hash || '#/home'}`,
    );
    routeSyncRef.current.initialized = true;

    const handleBrowserNavigation = () => {
      applyBrowserRoute();
    };

    window.addEventListener('popstate', handleBrowserNavigation);
    window.addEventListener('hashchange', handleBrowserNavigation);

    return () => {
      window.removeEventListener('popstate', handleBrowserNavigation);
      window.removeEventListener('hashchange', handleBrowserNavigation);
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !routeSyncRef.current.initialized) return;

    const nextProfileUsername = activeView === 'profile' ? (profileViewUsername || userProfile?.username || '') : '';
    const nextHash = buildAppHash({
      view: activeView,
      postId: activePostId,
      profileUsername: nextProfileUsername,
      profileTab,
      profileModal: activeView === 'profile'
        ? (isProfileSettingsOpen ? 'settings' : (profileConnectionsState.open ? 'connections' : ''))
        : '',
      profileSettingsSection,
      connectionType: profileConnectionsState.type,
    });
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

    if (routeSyncRef.current.skipNextPush) {
      routeSyncRef.current.skipNextPush = false;
      window.history.replaceState({ route: nextHash }, '', nextUrl);
      return;
    }

    if (window.location.hash === nextHash) {
      window.history.replaceState({ route: nextHash }, '', nextUrl);
      return;
    }

    window.history.pushState({ route: nextHash }, '', nextUrl);
  }, [
    activePostId,
    activeView,
    isProfileSettingsOpen,
    profileConnectionsState.open,
    profileConnectionsState.type,
    profileSettingsSection,
    profileTab,
    profileViewUsername,
    userProfile?.username,
  ]);

  useEffect(() => {
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

  useEffect(() => {
    if (!userProfile?.username) return;
    authorPreviewStatusRef.current[userProfile.username] = 'success';

    setAuthorPreviewByUsername((current) => ({
      ...current,
      [userProfile.username]: {
        status: 'success',
        data: {
          ...(current[userProfile.username]?.data ?? {}),
          ...userProfile,
          profilePhotoUrl: userProfile.profilePhotoUrl || '',
        },
      },
    }));
  }, [userProfile]);

  useEffect(() => {
    if (!viewedProfileMeta?.username) return;
    authorPreviewStatusRef.current[viewedProfileMeta.username] = 'success';

    setAuthorPreviewByUsername((current) => ({
      ...current,
      [viewedProfileMeta.username]: {
        status: 'success',
        data: {
          ...(current[viewedProfileMeta.username]?.data ?? {}),
          ...viewedProfileMeta,
          profilePhotoUrl: viewedProfileMeta.profilePhotoUrl || '',
        },
      },
    }));
  }, [viewedProfileMeta]);

  useEffect(() => {
    const uniqueAuthors = [...new Set(
      apiPosts
        .map((post) => `${post?.author ?? ''}`.trim())
        .filter(Boolean)
    )];
    const missingAuthors = uniqueAuthors.filter((username) => {
      const currentStatus = authorPreviewStatusRef.current[username];
      return currentStatus !== 'loading' && currentStatus !== 'success';
    });
    if (missingAuthors.length === 0) return;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    missingAuthors.forEach((username) => {
      authorPreviewStatusRef.current[username] = 'loading';
      setAuthorPreviewByUsername((current) => {
        if (current[username]?.status === 'loading' || current[username]?.status === 'success') {
          return current;
        }

        return {
          ...current,
          [username]: {
            status: 'loading',
            data: current[username]?.data ?? null,
          },
        };
      });

      fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(username)}`, { headers })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load author preview');
          return res.json();
        })
        .then((data) => {
          authorPreviewStatusRef.current[username] = 'success';
          setAuthorPreviewByUsername((current) => ({
            ...current,
            [username]: {
              status: 'success',
              data,
            },
          }));
        })
        .catch(() => {
          authorPreviewStatusRef.current[username] = 'error';
          setAuthorPreviewByUsername((current) => ({
            ...current,
            [username]: {
              status: 'error',
              data: current[username]?.data ?? null,
            },
          }));
        });
    });
  }, [apiPosts, token]);

  useEffect(() => {
    if (activeView !== 'post' || !activePostId) return;
    if (aiSummaryByPost[activePostId] || aiSummaryStatusByPost[activePostId] === 'loading') return;

    let isCancelled = false;
    setAiSummaryStatusByPost((current) => ({ ...current, [activePostId]: 'loading' }));

    fetch(`${API_BASE_URL}/api/posts/${activePostId}/ai-summary`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load AI summary');
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        setAiSummaryByPost((current) => ({ ...current, [activePostId]: data }));
        setAiSummaryStatusByPost((current) => ({ ...current, [activePostId]: 'success' }));
      })
      .catch(() => {
        if (isCancelled) return;
        setAiSummaryStatusByPost((current) => ({ ...current, [activePostId]: 'error' }));
      });

    return () => {
      isCancelled = true;
    };
  }, [activePostId, activeView, aiSummaryByPost, aiSummaryStatusByPost]);

  const handleNavClick = (id) => {
    if ((id === 'create' || id === 'bookmarks') && !userProfile && !token) {
      openAuthPage();
    } else {
      if (id === 'create') resetPostUploadState();
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

  const ensurePhoneRecaptcha = async () => {
    if (typeof window === 'undefined') return null;
    if (phoneRecaptchaVerifierRef.current) return phoneRecaptchaVerifierRef.current;

    const verifier = new RecaptchaVerifier(auth, 'firebase-phone-recaptcha', {
      size: 'invisible',
    });

    await verifier.render();
    phoneRecaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const resetPhoneAuthFlow = async () => {
    phoneConfirmationResultRef.current = null;
    if (phoneRecaptchaVerifierRef.current) {
      phoneRecaptchaVerifierRef.current.clear();
      phoneRecaptchaVerifierRef.current = null;
    }
  };

  const checkUsernameAvailability = async (username) => {
    const normalizedUsername = `${username ?? ''}`.trim();
    if (!normalizedUsername) throw new Error('Username is required.');

    const res = await fetch(`${API_BASE_URL}/api/auth/username-availability?username=${encodeURIComponent(normalizedUsername)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.reason || 'Failed to check username availability');
    if (!data?.available) throw new Error(data?.reason || 'That username is already taken.');
    return data.normalizedUsername || normalizedUsername;
  };

  const completeAuthenticatedSession = async (nextToken) => {
    localStorage.setItem('token', nextToken);
    setToken(nextToken);
    setIsGenderPromptDismissed(false);
    setGenderPromptValue('');
    setGenderPromptError('');
    await fetchProfile(nextToken);
    await resetPhoneAuthFlow();
    setProfileViewUsername(null);
    setActiveView('home');
  };

  const finalizeFirebaseAuth = async ({
    firebaseUser,
    mode,
    preferredDisplayName = '',
    signupProfile = null,
  }) => {
    const fallbackIdentity = firebaseUser.email || firebaseUser.phoneNumber || 'citizen';
    const displayName = preferredDisplayName || firebaseUser.displayName || fallbackIdentity.split('@')[0];

    const createPayload = (resolvedMode) => ({
      mode: resolvedMode,
      uid: firebaseUser.uid,
      ...(firebaseUser.email ? { email: firebaseUser.email } : {}),
      ...(firebaseUser.phoneNumber ? { phoneNumber: firebaseUser.phoneNumber } : {}),
      displayName,
      ...(signupProfile
        ? {
          username: signupProfile.username,
          phoneNumber: signupProfile.phoneNumber,
        }
        : {}),
    });

    let res = await fetch(`${API_BASE_URL}/api/auth/firebaseLogin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload(mode)),
    });
    let data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Authentication failed on server');

    await completeAuthenticatedSession(data.token);
  };

  const handleGoogleAuth = async ({ mode }) => {
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      if (shouldUseGoogleRedirect()) {
        storeGoogleAuthMode(mode);
        await signInWithRedirect(auth, provider);
        return;
      }

      const result = await signInWithPopup(auth, provider);
      await finalizeFirebaseAuth({
        firebaseUser: result.user,
        mode,
        preferredDisplayName: result.user.displayName,
        signupProfile: null,
      });
    } catch (err) {
      clearStoredGoogleAuthMode();
      firebaseSignOut(auth).catch(() => { });
      setAuthError(getGoogleAuthErrorMessage(err));
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleEmailAuth = async ({ mode, username, displayName, email, password }) => {
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup'
        ? {
          username,
          displayName,
          email,
          password,
        }
        : {
          email,
          password,
        };

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Unable to continue with email.');
      }

      await completeAuthenticatedSession(data.token);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handlePhoneAuth = async ({ action, mode, username, displayName, phoneNumber, otpCode }) => {
    setAuthError('');
    setIsAuthSubmitting(true);

    try {
      if (action === 'send-code') {
        if (mode === 'signup') {
          await checkUsernameAvailability(username);
        }

        await resetPhoneAuthFlow();
        const verifier = await ensurePhoneRecaptcha();
        phoneConfirmationResultRef.current = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        return { otpSent: true };
      }

      if (!phoneConfirmationResultRef.current) {
        throw new Error('Request a verification code first.');
      }

      const result = await phoneConfirmationResultRef.current.confirm(otpCode);

      await finalizeFirebaseAuth({
        firebaseUser: result.user,
        mode,
        preferredDisplayName: displayName,
        signupProfile: mode === 'signup'
          ? {
            username: await checkUsernameAvailability(username),
            phoneNumber,
          }
          : null,
      });

      await resetPhoneAuthFlow();
      return { otpSent: false };
    } catch (err) {
      if (action === 'send-code' && phoneRecaptchaVerifierRef.current) {
        phoneRecaptchaVerifierRef.current.clear();
        phoneRecaptchaVerifierRef.current = null;
      }
      if (action === 'verify-code' && mode === 'signup') {
        firebaseSignOut(auth).catch(() => { });
      }
      setAuthError(err.message);
      throw err;
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = () => {
    firebaseSignOut(auth).catch(() => { });
    resetPhoneAuthFlow().catch(() => { });
    localStorage.removeItem('token');
    setToken(null);
    setUserProfile(null);
    setViewedProfileMeta(null);
    setProfileViewUsername(null);
    setIsProfileSettingsOpen(false);
    setProfileSettingsStatus({ type: '', message: '' });
    setAuthError('');
    setSelectedDepartmentFilter('');
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsGenderPromptOpen(false);
    setIsGenderPromptDismissed(false);
    setGenderPromptValue('');
    setGenderPromptError('');
    setIsGenderPromptSubmitting(false);
    if (activeView === 'profile' || activeView === 'create' || activeView === 'bookmarks') setActiveView('home');
  };

  const handleGenderPromptClose = () => {
    if (isGenderPromptSubmitting) return;
    setIsGenderPromptOpen(false);
    setIsGenderPromptDismissed(true);
    setGenderPromptError('');
  };

  const handleGenderPromptSubmit = async (event) => {
    event.preventDefault();
    setGenderPromptError('');

    if (!genderPromptValue) {
      setGenderPromptError('Choose a gender option to continue.');
      return;
    }

    try {
      setIsGenderPromptSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/users/profile/gender`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gender: genderPromptValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile gender');

      setUserProfile((currentProfile) => (
        currentProfile
          ? { ...currentProfile, gender: data.gender || genderPromptValue }
          : currentProfile
      ));
      setIsGenderPromptOpen(false);
      setIsGenderPromptDismissed(false);
      setGenderPromptError('');
    } catch (error) {
      setGenderPromptError(error.message);
    } finally {
      setIsGenderPromptSubmitting(false);
    }
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
      setProfileSettingsStatus({ type: 'success', message: 'Profile photo updated.' });
      event.target.value = '';
    } catch (error) {
      alert(error.message);
    }
  };

  const uploadPostWithProgress = (formData) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${API_BASE_URL}/api/posts`);
    if (token) {
      request.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    request.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      const nextProgress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      setPostUploadProgress(nextProgress);
      setPostUploadStatus(nextProgress >= 100 ? 'publishing' : 'uploading');
    });

    request.addEventListener('load', () => {
      let data = {};
      try {
        data = request.responseText ? JSON.parse(request.responseText) : {};
      } catch {
        data = {};
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(data);
        return;
      }

      reject(new Error(data?.error || 'Failed to post issue'));
    });

    request.addEventListener('error', () => {
      reject(new Error('Network error while uploading post'));
    });

    request.addEventListener('abort', () => {
      reject(new Error('Post upload was cancelled'));
    });

    request.send(formData);
  });

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (isPostSubmitting) return;

    try {
      setIsPostSubmitting(true);
      setPostUploadProgress(0);
      setPostUploadStatus('uploading');
      setPostUploadFeedback('');
      const formData = new FormData();
      formData.append('title', postForm.title);
      formData.append('description', postForm.description);
      formData.append('location', postForm.location);
      formData.append('department', postForm.department);
      formData.append('media', postForm.media);
      mediaFiles.forEach(file => formData.append('files', file));

      await uploadPostWithProgress(formData);
      setPostUploadProgress(100);
      setPostUploadStatus('publishing');
      await fetchPublicData();
      setPostUploadStatus('success');
      setPostUploadFeedback('Post uploaded successfully.');
      setActiveView('home');
      setPostForm({ title: '', description: '', location: '', department: 'General', media: 'IMAGE' });
      setMediaFiles([]);
    } catch (err) {
      setPostUploadStatus('error');
      setPostUploadFeedback(err.message || 'Failed to post issue');
      alert(err.message);
    } finally {
      setIsPostSubmitting(false);
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
        const currentUrl = `${window.location.origin}${window.location.pathname}${buildAppHash({
          view: 'post',
          postId,
        })}`;

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
    closeProfileConnections();
    setIsProfileSettingsOpen(false);
    setProfileViewUsername(username);
    setProfileTab('reports');
    setActivePostId(null);
    setActiveView('profile');
  };

  const openOwnProfile = () => {
    if (!userProfile?.username) return;
    closeProfileConnections();
    setIsProfileSettingsOpen(false);
    setProfileViewUsername(userProfile.username);
    setProfileTab('reports');
    setActivePostId(null);
    setActiveView('profile');
  };

  const syncFollowState = (targetUsername, data) => {
    const normalizedTargetUsername = `${targetUsername ?? ''}`.trim();
    if (!normalizedTargetUsername) return;

    setUserProfile((currentProfile) => (
      currentProfile
        ? {
          ...currentProfile,
          following: Array.isArray(data.following) ? data.following : currentProfile.following,
        }
        : currentProfile
    ));
    setViewedProfileMeta((currentProfile) => (
      currentProfile && currentProfile.username === normalizedTargetUsername
        ? {
          ...currentProfile,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
          isFollowing: data.isFollowing,
        }
        : currentProfile
    ));
    setAuthorPreviewByUsername((current) => {
      const targetPreview = current[normalizedTargetUsername];
      const viewerUsername = `${userProfile?.username ?? ''}`.trim();
      const viewerPreview = viewerUsername ? current[viewerUsername] : null;
      let hasChanges = false;
      const next = { ...current };

      if (targetPreview?.data) {
        next[normalizedTargetUsername] = {
          ...targetPreview,
          data: {
            ...targetPreview.data,
            followerCount: data.followerCount,
            followingCount: data.followingCount,
            isFollowing: data.isFollowing,
          },
        };
        hasChanges = true;
      }

      if (viewerUsername && viewerPreview?.data && Array.isArray(data.following)) {
        next[viewerUsername] = {
          ...viewerPreview,
          data: {
            ...viewerPreview.data,
            following: data.following,
            followingCount: data.following.length,
          },
        };
        hasChanges = true;
      }

      return hasChanges ? next : current;
    });
    setProfileConnectionsState((current) => {
      if (current.status !== 'success') return current;

      let hasChanges = false;
      const nextItems = current.items
        .map((item) => (
          item.username === normalizedTargetUsername
            ? (() => {
              if (item.isFollowing === data.isFollowing) return item;
              hasChanges = true;
              return { ...item, isFollowing: data.isFollowing };
            })()
            : item
        ))
        .filter((item) => {
          if (
            current.type === 'following'
            && current.username === userProfile?.username
            && item.username === normalizedTargetUsername
            && !data.isFollowing
          ) {
            hasChanges = true;
            return false;
          }

          return true;
        });

      return hasChanges ? { ...current, items: nextItems } : current;
    });
  };

  const handleToggleFollow = async (username) => {
    const normalizedUsername = `${username ?? ''}`.trim();
    if (!normalizedUsername || normalizedUsername === userProfile?.username) return;
    if (!ensureAuthenticated()) return;
    if (isFollowSubmittingByUsername[normalizedUsername]) return;

    setIsFollowSubmittingByUsername((current) => ({ ...current, [normalizedUsername]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(normalizedUsername)}/follow`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update follow state');

      syncFollowState(normalizedUsername, data);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsFollowSubmittingByUsername((current) => {
        if (!(normalizedUsername in current)) return current;
        const next = { ...current };
        delete next[normalizedUsername];
        return next;
      });
    }
  };

  const handleToggleProfileFollow = () => {
    handleToggleFollow(resolvedProfileUsername);
  };

  const closeProfileConnections = () => {
    setProfileConnectionsState((current) => ({ ...current, open: false }));
  };

  const openProfileConnectionsPanel = async (type, usernameOverride = resolvedProfileUsername) => {
    const normalizedType = type === 'following' ? 'following' : 'followers';
    const targetUsername = `${usernameOverride ?? ''}`.trim();
    if (!targetUsername) return;

    setIsProfileSettingsOpen(false);
    setProfileConnectionsState({
      open: true,
      type: normalizedType,
      username: targetUsername,
      status: 'loading',
      items: [],
      error: '',
    });

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(
        `${API_BASE_URL}/api/users/${encodeURIComponent(targetUsername)}/connections?type=${normalizedType}`,
        { headers },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to fetch profile connections');

      const connectionItems = Array.isArray(data.connections) ? data.connections : [];
      setProfileConnectionsState({
        open: true,
        type: data.type === 'following' ? 'following' : 'followers',
        username: data.username || targetUsername,
        status: 'success',
        items: connectionItems,
        error: '',
      });
    } catch (error) {
      setProfileConnectionsState({
        open: true,
        type: normalizedType,
        username: targetUsername,
        status: 'error',
        items: [],
        error: error.message || 'Failed to fetch profile connections',
      });
    }
  };

  const handleOpenProfileConnections = async (type) => {
    await openProfileConnectionsPanel(type, resolvedProfileUsername);
  };

  const handleOpenConnectionProfile = (username) => {
    closeProfileConnections();
    openAuthorProfile(username);
  };

  const handleProfileShare = async () => {
    if (!resolvedProfileUsername || typeof window === 'undefined') return;

    const shareUrl = `${window.location.origin}${window.location.pathname}${buildAppHash({
      view: 'profile',
      profileUsername: resolvedProfileUsername,
      profileTab,
    })}`;
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
  };

  const openProfileSettings = (section = 'personal') => {
    closeProfileConnections();
    setProfileSettingsSection(section);
    setProfileSettingsStatus({ type: '', message: '' });
    setIsProfileSettingsOpen(true);
  };

  const closeProfileSettings = () => {
    if (isProfileSettingsSubmitting) return;
    setIsProfileSettingsOpen(false);
    setProfileSettingsStatus({ type: '', message: '' });
    setProfilePasswordDraft({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleProfileSettingsSectionChange = (section) => {
    setProfileSettingsSection(section);
    setProfileSettingsStatus({ type: '', message: '' });
  };

  const handleProfileNameSave = async (event) => {
    event.preventDefault();
    const nextDisplayName = `${profileNameDraft ?? ''}`.trim();
    if (!nextDisplayName) {
      setProfileSettingsStatus({ type: 'error', message: 'Enter a display name.' });
      return;
    }

    try {
      setIsProfileSettingsSubmitting(true);
      setProfileSettingsStatus({ type: '', message: '' });
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ displayName: nextDisplayName }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update display name');

      const nextToken = data?.token || token;
      if (nextToken) {
        localStorage.setItem('token', nextToken);
        setToken(nextToken);
      }
      await fetchProfile(nextToken);
      setViewedProfileMeta((currentProfile) => (
        currentProfile?.username === userProfile?.username
          ? { ...currentProfile, ...(data?.profile ?? {}), username: userProfile?.username || currentProfile.username }
          : currentProfile
      ));
      setProfileSettingsStatus({ type: 'success', message: 'Display name updated.' });
    } catch (error) {
      setProfileSettingsStatus({ type: 'error', message: error.message });
    } finally {
      setIsProfileSettingsSubmitting(false);
    }
  };

  const handleProfileUsernameSave = async (event) => {
    event.preventDefault();
    const nextUsername = `${profileUsernameDraft ?? ''}`.trim().toLowerCase();
    if (!nextUsername) {
      setProfileSettingsStatus({ type: 'error', message: 'Enter a username.' });
      return;
    }

    try {
      setIsProfileSettingsSubmitting(true);
      setProfileSettingsStatus({ type: '', message: '' });
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: nextUsername }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update username');

      const nextToken = data?.token || token;
      if (nextToken) {
        localStorage.setItem('token', nextToken);
        setToken(nextToken);
      }

      const updatedUsername = data?.profile?.username || nextUsername;
      setProfileViewUsername(updatedUsername);
      setProfileUsernameDraft(updatedUsername);
      await fetchPublicData(nextToken);
      await fetchProfile(nextToken);
      setViewedProfileMeta(data?.profile || null);
      setProfileSettingsStatus({ type: 'success', message: 'Username updated across your profile.' });
    } catch (error) {
      setProfileSettingsStatus({ type: 'error', message: error.message });
    } finally {
      setIsProfileSettingsSubmitting(false);
    }
  };

  const handleProfilePasswordSave = async (event) => {
    event.preventDefault();
    const currentPassword = `${profilePasswordDraft.currentPassword ?? ''}`;
    const nextPassword = `${profilePasswordDraft.newPassword ?? ''}`;
    const confirmPassword = `${profilePasswordDraft.confirmPassword ?? ''}`;

    if (!currentPassword) {
      setProfileSettingsStatus({ type: 'error', message: 'Enter your current password.' });
      return;
    }

    if (nextPassword.length < 6) {
      setProfileSettingsStatus({ type: 'error', message: 'New password must be at least 6 characters.' });
      return;
    }

    if (nextPassword !== confirmPassword) {
      setProfileSettingsStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    try {
      setIsProfileSettingsSubmitting(true);
      setProfileSettingsStatus({ type: '', message: '' });
      const res = await fetch(`${API_BASE_URL}/api/users/profile/password`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: nextPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to update password');

      setProfilePasswordDraft({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setProfileSettingsStatus({ type: 'success', message: 'Password updated.' });
    } catch (error) {
      setProfileSettingsStatus({ type: 'error', message: error.message });
    } finally {
      setIsProfileSettingsSubmitting(false);
    }
  };

  const handleSwitchAccount = () => {
    closeProfileSettings();
    handleLogout();
    openAuthPage();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setProfileViewUsername(null);
    setActivePostId(null);
    setActiveView('home');
    setIsSearchOpen(true);
  };

  const handleSearchPostOpen = (postId) => {
    if (!postId) return;
    setActivePostId(postId);
    setActiveView('post');
    setIsSearchOpen(false);
  };

  const handleSearchProfileOpen = (username) => {
    if (!username) return;
    openAuthorProfile(username);
    setIsSearchOpen(false);
  };

  const preloadAuthorPreview = async (username) => {
    const normalizedUsername = `${username ?? ''}`.trim();
    if (!normalizedUsername) return;
    const existingPreviewStatus = authorPreviewStatusRef.current[normalizedUsername];
    if (existingPreviewStatus === 'loading' || existingPreviewStatus === 'success') return;

    authorPreviewStatusRef.current[normalizedUsername] = 'loading';
    setAuthorPreviewByUsername((current) => {
      if (current[normalizedUsername]?.status === 'loading' || current[normalizedUsername]?.status === 'success') {
        return current;
      }

      return {
        ...current,
        [normalizedUsername]: {
          status: 'loading',
          data: current[normalizedUsername]?.data ?? null,
        },
      };
    });

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(normalizedUsername)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load author preview');

      authorPreviewStatusRef.current[normalizedUsername] = 'success';
      setAuthorPreviewByUsername((current) => ({
        ...current,
        [normalizedUsername]: {
          status: 'success',
          data,
        },
      }));
    } catch {
      authorPreviewStatusRef.current[normalizedUsername] = 'error';
      setAuthorPreviewByUsername((current) => ({
        ...current,
        [normalizedUsername]: {
          status: 'error',
          data: current[normalizedUsername]?.data ?? null,
        },
      }));
    }
  };

  const showAuthorHoverCard = (username) => {
    const normalizedUsername = `${username ?? ''}`.trim();
    if (!normalizedUsername) return;

    setActiveAuthorHoverCard(normalizedUsername);
    preloadAuthorPreview(normalizedUsername);
  };

  const hideAuthorHoverCard = () => {
    setActiveAuthorHoverCard('');
  };

  const getAuthorAvatarUrl = (username) => {
    const normalizedUsername = `${username ?? ''}`.trim();
    if (!normalizedUsername) return '';

    if (normalizedUsername === userProfile?.username) return profilePhotoUrl || userProfile?.profilePhotoUrl || '';
    if (normalizedUsername === viewedProfileMeta?.username) return viewedProfileMeta?.profilePhotoUrl || '';
    return authorPreviewByUsername[normalizedUsername]?.data?.profilePhotoUrl || '';
  };

  const handleReportPost = async (postId) => {
    if (!postId) return;
    if (!ensureAuthenticated()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to report post');

      setUserProfile((currentProfile) => (
        currentProfile
          ? {
            ...currentProfile,
            reportedPostIds: Array.isArray(data.reportedPostIds) ? data.reportedPostIds : currentProfile.reportedPostIds,
          }
          : currentProfile
      ));

      alert(data?.alreadyReported ? 'You already reported this post.' : 'Post reported. Our team will review it.');
    } catch (error) {
      alert(error.message);
    }
  };

  if (isLoading) return <PageLoader label="Connecting to server..." />;

  if (activeView === 'auth') {
    return (
      <AuthPage
        error={authError}
        isSubmitting={isAuthSubmitting}
        logo={Logo}
        onEmailAuth={handleEmailAuth}
        onGoogleAuth={handleGoogleAuth}
        onPhoneAuth={handlePhoneAuth}
      />
    );
  }

  const normalizedSearchQuery = normalizeSearchQuery(searchQuery);
  const authorPostCounts = apiPosts.reduce((counts, post) => {
    const author = `${post?.author ?? ''}`.trim();
    if (!author) return counts;
    counts[author] = (counts[author] ?? 0) + 1;
    return counts;
  }, {});
  const filteredHomePosts = apiPosts.filter((post) => {
    if (selectedDepartmentFilter && `${post?.department ?? ''}`.trim() !== selectedDepartmentFilter) return false;
    if (normalizedSearchQuery && !postMatchesSearchQuery(post, normalizedSearchQuery)) return false;
    return true;
  });
  const searchableAccountUsernames = [...new Set(
    [
      ...Object.keys(authorPostCounts),
      ...Object.keys(authorPreviewByUsername),
      userProfile?.username || '',
      viewedProfileMeta?.username || '',
    ].filter(Boolean)
  )];
  const matchedSearchAccounts = normalizedSearchQuery
    ? searchableAccountUsernames
      .map((username) => {
        const previewData = authorPreviewByUsername[username]?.data ?? {};
        const derivedPhotoUrl = username === userProfile?.username
          ? (profilePhotoUrl || userProfile?.profilePhotoUrl || previewData.profilePhotoUrl || '')
          : username === viewedProfileMeta?.username
            ? (viewedProfileMeta?.profilePhotoUrl || previewData.profilePhotoUrl || '')
            : (previewData.profilePhotoUrl || '');
        return {
          username,
          displayName: `${previewData.displayName ?? ''}`.trim(),
          role: `${previewData.role ?? ''}`.trim() || 'CitizenReporter',
          profilePhotoUrl: derivedPhotoUrl,
          followerCount: toCount(previewData.followerCount),
          postsCount: authorPostCounts[username] ?? 0,
        };
      })
      .filter((account) => accountMatchesSearchQuery(account, normalizedSearchQuery))
      .sort((firstAccount, secondAccount) => {
        const scoreDifference = getAccountSearchRank(secondAccount, normalizedSearchQuery) - getAccountSearchRank(firstAccount, normalizedSearchQuery);
        if (scoreDifference !== 0) return scoreDifference;
        return firstAccount.username.localeCompare(secondAccount.username);
      })
    : [];
  const searchAccountResults = matchedSearchAccounts.slice(0, 5);
  const matchedSearchPosts = normalizedSearchQuery
    ? [...apiPosts]
      .filter((post) => postMatchesSearchQuery(post, normalizedSearchQuery))
      .sort((firstPost, secondPost) => {
        const scoreDifference = getPostSearchRank(secondPost, normalizedSearchQuery) - getPostSearchRank(firstPost, normalizedSearchQuery);
        if (scoreDifference !== 0) return scoreDifference;
        return getTrendingScore(secondPost) - getTrendingScore(firstPost);
      })
    : [];
  const searchPostResults = matchedSearchPosts.slice(0, 6);
  const totalSearchResultCount = matchedSearchPosts.length + matchedSearchAccounts.length;
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
  const activePostConsensus = activePostId ? aiSummaryByPost[activePostId] ?? null : null;
  const activePostAiStatus = activePostId ? aiSummaryStatusByPost[activePostId] ?? 'idle' : 'idle';
  const bottomTrendingPosts = activePost
    ? trendingPosts.filter((post) => post.id !== activePost.id).slice(0, 6)
    : trendingPosts.slice(0, 6);
  const locationTrendingPosts = activePost
    ? [...apiPosts]
      .filter((post) => post.id !== activePost.id && isRelatedLocation(post.location, activePost.location))
      .sort((a, b) => getTrendingScore(b) - getTrendingScore(a))
    : [];
  const accountUsername = userProfile?.username || '';
  const followingUsernames = Array.isArray(userProfile?.following)
    ? [...new Set(userProfile.following.filter(Boolean))]
    : [];
  const savedPostIds = Array.isArray(userProfile?.bookmarkedPostIds)
    ? [...new Set(userProfile.bookmarkedPostIds.filter(Boolean))]
    : [];
  const reportedPostIds = Array.isArray(userProfile?.reportedPostIds)
    ? [...new Set(userProfile.reportedPostIds.filter(Boolean))]
    : [];
  const bookmarkedPosts = apiPosts.filter((post) => savedPostIds.includes(post.id));
  const bookmarkedDepartmentsCount = new Set(bookmarkedPosts.map((post) => post.department).filter(Boolean)).size;
  const bookmarkedTopDepartment = getMostFrequentValue(bookmarkedPosts.map((post) => post.department)) || 'No lead category yet';
  const normalizedResolvedProfileUsername = `${resolvedProfileUsername ?? ''}`.trim().toLowerCase();
  const normalizedOwnUsername = `${userProfile?.username ?? ''}`.trim().toLowerCase();
  const normalizedAccountUsername = `${accountUsername ?? ''}`.trim().toLowerCase();
  const isOwnProfile = !!normalizedOwnUsername && normalizedResolvedProfileUsername === normalizedOwnUsername;
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
  const isFollowingViewedProfile = !!normalizedAccountUsername
    && normalizedAccountUsername !== normalizedResolvedProfileUsername
    && followingUsernames.some((username) => `${username ?? ''}`.trim().toLowerCase() === normalizedResolvedProfileUsername);
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
  const profileJoinLabel = getProfileJoinLabel(
    isOwnProfile ? userProfile?.memberSince : viewedProfileMeta?.memberSince,
    resolvedProfileUsername,
  );
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
  const inferredUserLocation = getMostFrequentValue(profilePosts.map((post) => post.location))
    || getMostFrequentValue(apiPosts.map((post) => post.location))
    || 'India';
  const userLocationContext = parseLocationHierarchy(inferredUserLocation);
  const exactLocationTrending = buildLocationScopeTrends(apiPosts, userLocationContext, 'location').slice(0, 4);
  const cityTrending = buildLocationScopeTrends(
    apiPosts,
    userLocationContext,
    'city',
    new Set(exactLocationTrending.map((post) => post.id)),
  ).slice(0, 4);
  const stateTrending = buildLocationScopeTrends(
    apiPosts,
    userLocationContext,
    'state',
    new Set([...exactLocationTrending, ...cityTrending].map((post) => post.id)),
  ).slice(0, 4);
  const locationFirstTrendingPosts = mergeUniquePosts(
    exactLocationTrending,
    cityTrending,
    stateTrending,
  );
  const preferredTrendingPosts = (
    locationFirstTrendingPosts.length > 0 ? locationFirstTrendingPosts : trendingPosts
  ).slice(0, 6);
  const postViewTrendingPosts = (
    mergeUniquePosts(
      preferredTrendingPosts.filter((post) => post.id !== activePost?.id),
      bottomTrendingPosts,
    )
  ).slice(0, 6);
  const preferredTrendingHeading = locationFirstTrendingPosts.length > 0
    ? (userLocationContext.locationLabel ? `Trending Near ${userLocationContext.locationLabel}` : 'Trending Near You')
    : 'Trending Issues';
  const preferredTrendingDescription = locationFirstTrendingPosts.length > 0
    ? `Based on reports around ${userLocationContext.locationLabel || 'your nearby community'}.`
    : 'Top issues gaining attention across the full community.';
  const preferredTrendingEmptyLabel = locationFirstTrendingPosts.length > 0
    ? `No trending issues found around ${userLocationContext.locationLabel || 'your area'} yet.`
    : 'No trending issues yet.';

  const renderPostMedia = (post) => {
    const mediaList = Array.isArray(post?.mediaList) ? post.mediaList : [];
    const activeSlideIndex = mediaSlideIndexByPost[post.id] ?? 0;
    const canGoPrev = activeSlideIndex > 0;
    const canGoNext = activeSlideIndex < mediaList.length - 1;

    return (
      <div
        className="space-y-2"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
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
                onClick={(event) => {
                  event.stopPropagation();
                  scrollMediaByStep(post.id, -1);
                }}
                disabled={!canGoPrev}
                className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/55 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  scrollMediaByStep(post.id, 1);
                }}
                disabled={!canGoNext}
                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/35 bg-slate-900/55 p-2 text-white backdrop-blur disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          {mediaList.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-1.5">
              {mediaList.map((_, dotIndex) => (
                <button
                  key={`${post.id}-dot-${dotIndex}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
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
                  className={`h-1.5 rounded-full transition-all ${activeSlideIndex === dotIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
                    }`}
                  aria-label={`Go to media ${dotIndex + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
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
                className={`transition disabled:cursor-not-allowed disabled:opacity-50 ${currentVote === 'up' ? 'text-emerald-700' : 'hover:text-slate-800'
                  }`}
              >
                Agree {agreeCount > 0 ? agreeCount : ''}
              </button>
              <button
                type="button"
                disabled={isSolutionActionSubmitting || !canInteract}
                onClick={() => handleSolutionVote(postId, solutionIndex, currentVote === 'down' ? 'clear-down' : 'down', replyPath)}
                className={`transition disabled:cursor-not-allowed disabled:opacity-50 ${currentVote === 'down' ? 'text-red-600' : 'hover:text-slate-800'
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

  const renderSearchResultsDropdown = () => {
    if (!(isSearchOpen && normalizedSearchQuery)) return null;

    return (
      <div className="motion-pop absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 max-h-[min(70vh,calc(100vh-8.5rem))] overflow-y-auto rounded-[24px] border border-slate-200 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)] sm:rounded-[28px]">
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Search Results</p>
          <p className="mt-1 text-sm text-slate-600">
            {totalSearchResultCount > 0
              ? `${formatCount(totalSearchResultCount)} matches across posts and people for "${searchQuery.trim()}".`
              : `No matches found for "${searchQuery.trim()}".`}
          </p>
        </div>

        {searchAccountResults.length > 0 && (
          <div className="border-b border-slate-200 px-2 py-3 sm:px-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">People</p>
            <div className="space-y-1">
              {searchAccountResults.map((account) => (
                <button
                  key={`search-account-${account.username}`}
                  type="button"
                  onClick={() => handleSearchProfileOpen(account.username)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  {account.profilePhotoUrl ? (
                    <img src={account.profilePhotoUrl} alt={account.username} className="h-11 w-11 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold uppercase text-white">
                      {getInitials(account.username)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{account.displayName || account.username}</p>
                    <p className="truncate text-xs text-slate-500">@{account.username} • {account.role}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-slate-950">{formatCount(account.postsCount)}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">posts</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-2 py-3 sm:px-3">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Posts</p>
          {searchPostResults.length > 0 ? (
            <div className="space-y-1">
              {searchPostResults.map((post) => (
                <button
                  key={`search-post-${post.id}`}
                  type="button"
                  onClick={() => handleSearchPostOpen(post.id)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{post.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{getDescriptionPreview(post.description, false, 96).previewText}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {post.tag && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{post.tag}</span>}
                      <span>{post.department}</span>
                      <span>{post.author}</span>
                    </div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-bold text-slate-950">{formatCount(post.support)}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">supports</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              No posts matched this keyword, tag, or category yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const postUploadButtonLabel = (() => {
    if (postUploadStatus === 'publishing') return 'Publishing';
    if (postUploadStatus === 'uploading') return `Uploading ${postUploadProgress}%`;
    if (postUploadStatus === 'success') return 'Uploaded';
    if (postUploadStatus === 'error') return 'Retry upload';
    return `Post issue as ${userProfile?.username || 'you'}`;
  })();

  return (
    <div className="app-shell min-h-screen bg-slate-50 text-slate-900">
      <div className="sticky top-0 z-50">
      <header className="app-header border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 w-full max-w-[1580px] items-center px-3 py-2 sm:h-16 sm:min-h-0 sm:px-4 sm:py-0 lg:px-6">
          <div className="flex w-full items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setActivePostId(null);
                setProfileViewUsername(null);
                setActiveView('home');
              }}
              className="flex shrink-0 items-center gap-2 sm:gap-2.5"
            >
              <img src={Logo} alt="Public Policy Hub Logo" className="h-11 w-auto object-contain sm:h-[90px] sm:-my-4" />
              <div className="hidden sm:block">
                <p className="font-display text-xs uppercase tracking-[0.2em] text-slate-500">Public Policy Hub</p>
                <p className="text-sm text-slate-600">Nation is our, We have the Power</p>
              </div>
            </button>

            <div ref={searchPanelRef} className="ml-auto hidden min-w-0 flex-1 md:block">
              <form onSubmit={handleSearchSubmit} className="mx-auto flex max-w-[52rem] items-center gap-3 px-4">
                <div className="relative min-w-0 flex-1">
                  <SearchInput
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchOpen(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setIsSearchOpen(false);
                    }}
                    onClear={clearSearch}
                    placeholder="Search.."
                    showClear={!!searchQuery.trim()}
                  />

                  {isSearchOpen && normalizedSearchQuery && (
                    <div className="motion-pop absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.42)]">
                      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Search Results</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {totalSearchResultCount > 0
                            ? `${formatCount(totalSearchResultCount)} matches across posts and people for "${searchQuery.trim()}".`
                            : `No matches found for "${searchQuery.trim()}".`}
                        </p>
                      </div>

                      {searchAccountResults.length > 0 && (
                        <div className="border-b border-slate-200 px-3 py-3">
                          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">People</p>
                          <div className="space-y-1">
                            {searchAccountResults.map((account) => (
                              <button
                                key={`search-account-${account.username}`}
                                type="button"
                                onClick={() => handleSearchProfileOpen(account.username)}
                                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                              >
                                {account.profilePhotoUrl ? (
                                  <img src={account.profilePhotoUrl} alt={account.username} className="h-11 w-11 rounded-2xl object-cover" />
                                ) : (
                                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold uppercase text-white">
                                    {getInitials(account.username)}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-950">{account.displayName || account.username}</p>
                                  <p className="truncate text-xs text-slate-500">@{account.username} • {account.role}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-950">{formatCount(account.postsCount)}</p>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">posts</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="px-3 py-3">
                        <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Posts</p>
                        {searchPostResults.length > 0 ? (
                          <div className="space-y-1">
                            {searchPostResults.map((post) => (
                              <button
                                key={`search-post-${post.id}`}
                                type="button"
                                onClick={() => handleSearchPostOpen(post.id)}
                                className="flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-950">{post.title}</p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500">{getDescriptionPreview(post.description, false, 96).previewText}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    {post.tag && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{post.tag}</span>}
                                    <span>{post.department}</span>
                                    <span>{post.author}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-slate-950">{formatCount(post.support)}</p>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">supports</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            No posts matched this keyword, tag, or category yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <ThemeSwitch checked={theme === 'dark'} onChange={handleThemeToggle} label="Theme" />
              </form>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {userProfile ? (
                <>
                  <button onClick={() => handleNavClick('create')} className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:inline-flex">
                    Report Issue
                  </button>
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
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50 sm:gap-3 sm:rounded-2xl sm:px-2.5"
                  >
                    {profilePhotoUrl ? (
                      <img src={profilePhotoUrl} alt="Profile" className="h-9 w-9 rounded-xl object-cover sm:h-10 sm:w-10 sm:rounded-2xl" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white uppercase sm:h-10 sm:w-10 sm:rounded-2xl">
                        {accountInitials}
                      </span>
                    )}
                    <span className="hidden text-left sm:block">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Profile</span>
                      <span className="block text-sm font-bold text-slate-900">{accountUsername}</span>
                    </span>
                  </button>
                </>
              ) : (
                <button onClick={openAuthPage} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 sm:px-4 sm:text-sm">
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
        <div ref={mobileSearchPanelRef} className="mx-auto max-w-[1580px]">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchInput
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) setIsSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') setIsSearchOpen(false);
                }}
                onClear={clearSearch}
                placeholder="Search posts and people"
                showClear={!!searchQuery.trim()}
              />
              {renderSearchResultsDropdown()}
            </div>
            <ThemeSwitch checked={theme === 'dark'} onChange={handleThemeToggle} label="Theme" compact />
          </form>
        </div>
      </div>
      </div>

      <main className="app-main mobile-safe mx-auto grid w-full max-w-[1580px] gap-4 px-3 pb-24 pt-4 sm:gap-5 sm:px-4 sm:pt-5 lg:grid-cols-[270px_minmax(0,1fr)_290px] lg:gap-7 lg:px-6 lg:pt-0">
        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:h-fit lg:self-start lg:border-r lg:border-slate-200 lg:pr-4">
          <div className="soft-card p-4">
            <p className="px-2 text-sm font-semibold text-slate-500">Navigation</p>
            <div className="mt-3 space-y-2">
              {navItems.map((item) => {
                const Icon = item.Icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`nav-pill flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-base font-semibold transition ${activeView === item.id ? 'nav-pill--active bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="nav-pill__icon h-5 w-5" />
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
                  className={`signal-tile flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left transition ${selectedDepartmentFilter === department
                    ? 'border-blue-200 bg-blue-50 shadow-[0_14px_30px_-24px_rgba(37,99,235,0.75)]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
                    }`}
                >
                  <div className="min-w-0">
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${selectedDepartmentFilter === department ? 'text-blue-700' : 'text-slate-500'
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

          {activeView === 'post' && activePost && (
            <div className="soft-card p-4">
              <div className="px-2">
                <p className="text-sm font-semibold text-slate-500">Trending In {activePost.location}</p>
                <p className="mt-1 text-xs text-slate-400">Other issues gaining attention in the same location.</p>
              </div>
              <div className="mt-3 space-y-2">
                {locationTrendingPosts.map((post, index) => (
                  <button
                    key={`${post.id}-location-trend`}
                    type="button"
                    onClick={() => {
                      setActivePostId(post.id);
                      setActiveView('post');
                    }}
                    className="signal-tile w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition hover:bg-white"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                      #{index + 1} In this area
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-slate-900">{post.title}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatCount(post.support)} supports</p>
                  </button>
                ))}

                {locationTrendingPosts.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                    No other trending issues found for this location yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeView === 'home' && (
            <div className="soft-card p-4">
              <div className="px-2">
                <p className="text-sm font-semibold text-slate-500">Trending Around You</p>
                <p className="mt-1 text-xs text-slate-400">
                  Based on {userLocationContext.locationLabel || 'community location signals'}.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                <LocationTrendSection
                  title={userLocationContext.locationLabel ? `In ${userLocationContext.locationLabel}` : 'In your area'}
                  posts={exactLocationTrending}
                  emptyLabel="No exact-location trends yet."
                  onOpenPost={(postId) => {
                    setActivePostId(postId);
                    setActiveView('post');
                  }}
                />
                <LocationTrendSection
                  title={userLocationContext.city ? `In ${userLocationContext.city}` : 'In your city'}
                  posts={cityTrending}
                  emptyLabel="No broader city trends yet."
                  onOpenPost={(postId) => {
                    setActivePostId(postId);
                    setActiveView('post');
                  }}
                />
                <LocationTrendSection
                  title={userLocationContext.state ? `In ${userLocationContext.state}` : 'In your state'}
                  posts={stateTrending}
                  emptyLabel="No broader state trends yet."
                  onOpenPost={(postId) => {
                    setActivePostId(postId);
                    setActiveView('post');
                  }}
                />
              </div>
            </div>
          )}
        </aside>

        <section className="motion-fade-up mx-auto w-full max-w-[980px] space-y-6" style={{ '--motion-delay': '80ms' }}>
          {activeView === 'home' && (
            <>
              <div className="soft-card signal-hero p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Post Section</p>
                    <h2 className="mt-1.5 font-display text-[24px] font-bold text-slate-950 sm:text-[30px]">Community reports and updates</h2>
                    <p className="mt-2 text-sm text-slate-500 sm:text-base">
                      {normalizedSearchQuery
                        ? `Showing search matches for "${searchQuery.trim()}" across tags, categories, authors, and post keywords.`
                        : selectedDepartmentFilter
                          ? `Showing the latest reports from ${selectedDepartmentFilter}.`
                          : 'Evidence-first reports from citizens and contributors.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {normalizedSearchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        <Search className="h-4 w-4" />
                        {searchQuery.trim()}
                        <span className="text-slate-400">/</span>
                        Clear
                      </button>
                    )}
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
                </div>
                {normalizedSearchQuery && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Search checks post titles, descriptions, tags, categories, and author accounts from the current feed.
                  </div>
                )}
                {selectedDepartmentFilter && (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900">
                    Filtering the main feed by department while keeping the sidebar rankings based on all reported cases.
                  </div>
                )}
              </div>

              <div className="space-y-5 stagger-container">
                {filteredHomePosts.map((post, index) => {
                  const isSupportedByUser = !!userProfile?.username && post.supporters?.includes(userProfile.username);
                  const isSavedByUser = savedPostIds.includes(post.id);
                  const hasReportedPost = reportedPostIds.includes(post.id);
                  const isOwnPost = !!userProfile?.username && post.author === userProfile.username;
                  const isFollowingAuthor = !!accountUsername && post.author !== accountUsername && followingUsernames.includes(post.author);
                  const isSubmittingAuthorFollow = !!isFollowSubmittingByUsername[post.author];
                  const isSubmittingAction = !!isActionSubmittingByPost[post.id];
                  const isDescriptionExpanded = !!expandedDescriptionByPost[post.id];
                  const isPostMenuOpen = activePostMenuId === post.id;
                  const isAuthorHoverOpen = activeAuthorHoverCard === post.author;
                  const authorPreviewState = authorPreviewByUsername[post.author];
                  const authorPreviewData = authorPreviewState?.data ?? null;
                  const authorAvatarUrl = getAuthorAvatarUrl(post.author);
                  const authorPreviewMemberLabel = formatMemberSinceLabel(authorPreviewData?.memberSince, post.author);
                  const authorPreviewDurationLabel = formatMembershipDuration(authorPreviewData?.memberSince);
                  const { previewText, isTruncated } = getDescriptionPreview(post.description, isDescriptionExpanded);

                  return (
                    <article
                      key={post.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSolutionClick(post.id)}
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter' && event.key !== ' ') return;
                        event.preventDefault();
                        handleSolutionClick(post.id);
                      }}
                      className="soft-card signal-card float-hover group cursor-pointer overflow-hidden p-4 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:p-5"
                      style={getMotionDelayStyle(index, 140, 70)}
                    >
                      <div className="space-y-4">
                        <div className="flex w-full flex-col gap-3 rounded-xl px-1 text-left sm:flex-row sm:items-start sm:justify-between">
                          <div
                            className="relative flex min-w-0 items-center gap-3"
                            onMouseEnter={() => showAuthorHoverCard(post.author)}
                            onMouseLeave={hideAuthorHoverCard}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openAuthorProfile(post.author);
                              }}
                              onFocus={() => showAuthorHoverCard(post.author)}
                              onBlur={hideAuthorHoverCard}
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white transition hover:bg-slate-700"
                            >
                              {authorAvatarUrl ? (
                                <img src={authorAvatarUrl} alt={post.author} className="h-full w-full rounded-full object-cover" />
                              ) : (
                                post.author.slice(0, 2)
                              )}
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAuthorProfile(post.author);
                                }}
                                onFocus={() => showAuthorHoverCard(post.author)}
                                onBlur={hideAuthorHoverCard}
                                className="truncate text-sm font-semibold text-slate-900 transition hover:text-blue-700"
                              >
                                {post.author}
                              </button>
                              <p className="text-xs text-slate-500">{formatPostTimestamp(post)}</p>
                            </div>

                            {isAuthorHoverOpen && (
                              <div
                                className="motion-pop absolute left-0 top-full z-30 mt-3 w-[280px] max-w-[calc(100vw-3rem)] rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <div className="flex items-start gap-3">
                                  {authorPreviewData?.profilePhotoUrl ? (
                                    <img
                                      src={authorPreviewData.profilePhotoUrl}
                                      alt={post.author}
                                      className="h-14 w-14 rounded-2xl object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold uppercase text-white">
                                      {getInitials(post.author)}
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        openAuthorProfile(post.author);
                                      }}
                                      className="truncate text-left text-base font-bold text-slate-950 transition hover:text-blue-700"
                                    >
                                      {post.author}
                                    </button>
                                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                      {authorPreviewData?.role || 'CitizenReporter'}
                                    </p>
                                    <p className="mt-2 text-sm text-slate-600">
                                      {authorPreviewState?.status === 'loading'
                                        ? 'Loading profile details...'
                                        : `${authorPreviewDurationLabel} on Public Policy Hub`}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2">
                                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Followers</p>
                                    <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(authorPreviewData?.followerCount ?? 0)}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Following</p>
                                    <p className="mt-1 text-lg font-bold text-slate-950">{formatCount(authorPreviewData?.followingCount ?? 0)}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Member</p>
                                    <p className="mt-1 text-lg font-bold text-slate-950">{authorPreviewDurationLabel}</p>
                                  </div>
                                </div>

                                <p className="mt-3 text-xs text-slate-500">
                                  Member since {authorPreviewMemberLabel}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex w-full flex-shrink-0 items-start justify-between gap-2 sm:w-auto sm:justify-start">
                            {!isOwnPost && (
                              <button
                                type="button"
                                disabled={isSubmittingAuthorFollow}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleToggleFollow(post.author);
                                }}
                                className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${isFollowingAuthor
                                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  }`}
                              >
                                {isFollowingAuthor ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                                {isSubmittingAuthorFollow ? 'Updating...' : isFollowingAuthor ? 'Following' : 'Follow'}
                              </button>
                            )}

                            <div
                              className="relative flex-shrink-0"
                              ref={(element) => setPostMenuRef(post.id, element)}
                            >
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActivePostMenuId((current) => (current === post.id ? null : post.id));
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                aria-label="Open post menu"
                                aria-expanded={isPostMenuOpen}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {isPostMenuOpen && (
                                <div
                                  className="motion-pop absolute right-0 top-12 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.5)]"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    disabled={isSubmittingAction}
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      handleToggleSavedPost(post.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Bookmark className={`h-4 w-4 ${isSavedByUser ? 'fill-current text-amber-600' : ''}`} />
                                    {isSavedByUser ? 'Remove bookmark' : 'Bookmark post'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSubmittingAction}
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      handleShare(post.id);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Share2 className="h-4 w-4" />
                                    Share post
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSubmittingAction || isOwnPost || hasReportedPost}
                                    onClick={() => {
                                      setActivePostMenuId(null);
                                      handleReportPost(post.id);
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isOwnPost || hasReportedPost
                                      ? 'text-slate-400'
                                      : 'text-rose-600 hover:bg-rose-50'
                                      }`}
                                  >
                                    <Flag className="h-4 w-4" />
                                    {isOwnPost ? 'Cannot report your post' : hasReportedPost ? 'Already reported' : 'Report post'}
                                  </button>
                                  {isOwnPost && (
                                    <button
                                      type="button"
                                      disabled={isSubmittingAction}
                                      onClick={() => {
                                        setActivePostMenuId(null);
                                        handleDeletePost(post.id);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete post
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-slate-700 hover:gradient-text-animate transition-all">{post.title}</h3>
                          <p className="mt-1.5 sm:mt-2 text-sm leading-relaxed text-slate-600">{previewText}</p>
                          {isTruncated && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedDescriptionByPost((current) => ({ ...current, [post.id]: !isDescriptionExpanded }))
                              }}
                              className="mt-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                            >
                              {isDescriptionExpanded ? 'Read less' : 'Read more'}
                            </button>
                          )}
                        </div>
                        {renderPostMedia(post)}

                        <div className="order-2 space-y-3">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-blue-700"><MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{post.location}</span>
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-600"><Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{post.department}</span>
                            {post.verified && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700"><BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />Verified</span>}
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSupport(post.id);
                              }}
                              className={`btn-interactive hover-lift flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${isSupportedByUser
                                ? 'border-blue-700 bg-blue-600 text-white shadow-[0_6px_16px_-8px_rgba(29,78,216,0.9)] ring-1 ring-blue-500/60 hover:bg-blue-700 animate-glow'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-blue-300'
                                }`}
                            >
                              <TrendingUp className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Support {formatCount(post.support)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSolutionClick(post.id);
                              }}
                              className="btn-interactive hover-lift flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 hover:border-amber-300"
                            >
                              <Lightbulb className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Solution {formatCount(post.solutions)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleShare(post.id);
                              }}
                              className="btn-interactive hover-lift flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Share2 className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Share {formatCount(post.shares)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredHomePosts.length === 0 && (
                  <div className="soft-card p-5 text-sm text-slate-600 sm:p-6">
                    {normalizedSearchQuery
                      ? `No reports matched "${searchQuery.trim()}". Try another keyword, tag, category, or account name.`
                      : selectedDepartmentFilter
                        ? `No reports found for ${selectedDepartmentFilter} yet. Try another category or clear the filter.`
                        : 'No posts available yet. Trending posts will appear here once issues are published.'}
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'bookmarks' && (
            <>
              <div className="soft-card signal-hero p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                      <Bookmark className="h-3.5 w-3.5 fill-current" />
                      Personal Library
                    </span>
                    <h2 className="mt-4 font-display text-[24px] font-bold text-slate-950 sm:text-[30px]">Saved posts</h2>
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
                {bookmarkedPosts.map((post, index) => (
                  <BookmarkedPostCard
                    key={`${post.id}-bookmark`}
                    post={post}
                    delayMs={120 + (index * 70)}
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
                const isFollowingActiveAuthor = !!accountUsername && activePost.author !== accountUsername && followingUsernames.includes(activePost.author);
                const isSubmittingActiveAuthorFollow = !!isFollowSubmittingByUsername[activePost.author];
                const solutionInput = solutionInputsByPost[activePost.id] ?? '';
                const isSubmittingAction = !!isActionSubmittingByPost[activePost.id];
                const isDescriptionExpanded = !!expandedDescriptionByPost[activePost.id];
                const activeAuthorAvatarUrl = getAuthorAvatarUrl(activePost.author);
                const {
                  previewText: activeDescriptionPreview,
                  isTruncated: isActiveDescriptionTruncated
                } = getDescriptionPreview(activePost.description, isDescriptionExpanded, 260);

                return (
                  <>
                    <article className="soft-card signal-card overflow-hidden rounded-b-none border-b-0 p-4 sm:p-5">
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

                        <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-1 text-left">
                          <div className="flex items-center gap-3">
                            {activeAuthorAvatarUrl ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAuthorProfile(activePost.author);
                                }}
                                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-xs font-bold uppercase text-white transition hover:bg-slate-700"
                              >
                                <img src={activeAuthorAvatarUrl} alt={activePost.author} className="h-full w-full object-cover" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAuthorProfile(activePost.author);
                                }}
                                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white transition hover:bg-slate-700"
                              >
                                {activePost.author.slice(0, 2)}
                              </button>
                            )}
                            <div>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openAuthorProfile(activePost.author);
                                }}
                                className="text-sm font-semibold text-slate-900 transition hover:text-blue-700"
                              >
                                {activePost.author}
                              </button>
                              <p className="text-xs text-slate-500">{activePost.time}</p>
                            </div>
                          </div>

                          {!isOwnActivePost && (
                            <button
                              type="button"
                              disabled={isSubmittingActiveAuthorFollow}
                              onClick={() => handleToggleFollow(activePost.author)}
                              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${isFollowingActiveAuthor
                                ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                              {isFollowingActiveAuthor ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                              {isSubmittingActiveAuthorFollow ? 'Updating...' : isFollowingActiveAuthor ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>

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

                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2">
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleSupport(activePost.id)}
                              className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] sm:text-[11px] font-semibold transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${isSupportedByUser
                                ? 'border-blue-700 bg-blue-600 text-white shadow-[0_6px_16px_-8px_rgba(29,78,216,0.9)] ring-1 ring-blue-500/60 hover:bg-blue-700'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              <TrendingUp className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Support {formatCount(activePost.support)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleSolutionClick(activePost.id)}
                              className="flex items-center justify-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-1 py-1.5 text-[10px] sm:text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Lightbulb className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Solution {formatCount(activePost.solutions)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleShare(activePost.id)}
                              className="flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100 sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Share2 className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                              <span className="truncate">Share {formatCount(activePost.shares)}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAction}
                              onClick={() => handleToggleSavedPost(activePost.id)}
                              className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] sm:text-[11px] font-semibold transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${isSavedByUser
                                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                              <Bookmark className={`h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4 ${isSavedByUser ? 'fill-current' : ''}`} />
                              <span className="truncate">{isSavedByUser ? 'Saved' : 'Save'}</span>
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

                    <div className="soft-card rounded-t-none border-t-0 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">People's Solutions</p>

                      <div className="mt-5 space-y-5">
                        {activePostSolutions.length === 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            No solutions yet. Be the first to post one.
                          </div>
                        )}

                        {activePostSolutions.map((solution) => renderDiscussionEntry(activePost.id, solution, 0))}
                      </div>
                    </div>

                    <div className="soft-card rounded-t-none border-t-0 p-4 sm:p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                        {locationFirstTrendingPosts.length > 0 ? 'Trending Near You' : 'Trending Issues'}
                      </p>
                      <div className="mt-4 space-y-3">
                        {postViewTrendingPosts.map((post, index) => (
                          <button
                            key={`${post.id}-post-trend`}
                            type="button"
                            onClick={() => {
                              setActivePostId(post.id);
                              setActiveView('post');
                            }}
                            className="signal-tile w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-white"
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">#{index + 1} Trending</p>
                            <p className="mt-1.5 text-base font-semibold leading-6 text-slate-950">{post.title}</p>
                            <p className="mt-2 text-sm text-slate-500">
                              {formatCount(post.support)} supports • {post.department}
                            </p>
                          </button>
                        ))}
                        {postViewTrendingPosts.length === 0 && (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                            {preferredTrendingEmptyLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {activeView === 'create' && (
            <div className="soft-card signal-hero p-5 sm:p-6">
              <p className="text-xs font-semibold text-slate-500">Create New Issue</p>
              <h2 className="mt-1.5 font-display text-[24px] font-bold text-slate-950 sm:text-[28px]">Simple, mobile-friendly reporting.</h2>
              <form onSubmit={handlePostSubmit} className="mt-6 space-y-5">
                <div className="space-y-4">
                  <label className="upload-zone flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition">
                    <div className="upload-zone__inner flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="upload-zone__icons mb-2 flex gap-2">
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
                <input type="text" placeholder="Title" required className="form-input" value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <input type="text" placeholder="Location" required className="form-input" value={postForm.location} onChange={e => setPostForm({ ...postForm, location: e.target.value })} />
                  <select className="form-input" value={postForm.department} onChange={e => setPostForm({ ...postForm, department: e.target.value })}>
                    <option>General</option><option>Police</option><option>Municipality</option><option>Education</option><option>Transport</option>
                  </select>
                </div>
                <textarea rows="5" placeholder="Description" required className="w-full min-h-[140px] resize-none rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" value={postForm.description} onChange={e => setPostForm({ ...postForm, description: e.target.value })} />
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={isPostSubmitting}
                    className={`upload-progress-btn ${isPostSubmitting ? 'upload-progress-btn--busy' : ''} ${postUploadStatus === 'success' ? 'upload-progress-btn--success' : ''}`}
                    style={{ '--upload-progress': `${postUploadProgress}%` }}
                  >
                    <span className="upload-progress-btn__label">{postUploadButtonLabel}</span>
                  </button>
                  <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span>
                      {postUploadStatus === 'publishing'
                        ? 'Upload complete. Finalizing your post...'
                        : postUploadStatus === 'uploading'
                          ? 'Uploading in real time.'
                          : postUploadFeedback || 'Your button progress bar matches the live upload progress.'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {isPostSubmitting || postUploadProgress > 0 ? `${postUploadProgress}%` : ''}
                    </span>
                  </div>
                </div>
              </form>
            </div>
          )}

          {activeView === 'alerts' && (
            <div className="soft-card signal-hero p-5 sm:p-6">
              <p className="text-xs font-semibold text-slate-500">Notifications</p>
              <h2 className="mt-1.5 font-display text-[24px] font-bold text-slate-950 sm:text-[28px]">Updates related to your reports</h2>
              <div className="mt-6 space-y-3">
                {!userProfile && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Sign in to receive backend-powered notifications for follows, supports, comments, solutions, replies, and shares.
                  </div>
                )}

                {userProfile && apiNotifications.map((item) => (
                  <div key={item.id} className="alert-card rounded-xl border border-slate-200 bg-slate-50 p-4 pl-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">
                          {getNotificationTypeLabel(item.type)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">{item.message}</p>
                        <p className="mt-2 text-xs text-slate-500">{formatTimestamp(item.createdAt)}</p>
                      </div>
                      {item.postId && (
                        <button
                          type="button"
                          onClick={() => handleSolutionClick(item.postId)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Open post
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {userProfile && apiNotifications.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No notifications yet. Activity on your reports and profile will show up here.
                  </div>
                )}
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
                onOpenConnections={handleOpenProfileConnections}
                onCreateReport={() => handleNavClick('create')}
                onOpenSettings={openProfileSettings}
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
              />
              <ProfileConnectionsModal
                isOpen={profileConnectionsState.open}
                type={profileConnectionsState.type}
                profileUsername={profileConnectionsState.username}
                status={profileConnectionsState.status}
                items={profileConnectionsState.items}
                error={profileConnectionsState.error}
                viewerUsername={accountUsername}
                isFollowSubmittingByUsername={isFollowSubmittingByUsername}
                onClose={closeProfileConnections}
                onOpenProfile={handleOpenConnectionProfile}
                onToggleFollow={handleToggleFollow}
              />
              <ProfileSettingsModal
                isOpen={isOwnProfile && isProfileSettingsOpen}
                activeSection={profileSettingsSection}
                status={profileSettingsStatus}
                isSubmitting={isProfileSettingsSubmitting}
                profile={userProfile}
                profilePhotoUrl={profilePhotoUrl}
                profileJoinLabel={profileJoinLabel}
                nameDraft={profileNameDraft}
                usernameDraft={profileUsernameDraft}
                passwordDraft={profilePasswordDraft}
                onClose={closeProfileSettings}
                onSectionChange={handleProfileSettingsSectionChange}
                onEditPhoto={() => profilePhotoInputRef.current?.click()}
                onNameDraftChange={setProfileNameDraft}
                onUsernameDraftChange={setProfileUsernameDraft}
                onPasswordDraftChange={setProfilePasswordDraft}
                onSaveName={handleProfileNameSave}
                onSaveUsername={handleProfileUsernameSave}
                onSavePassword={handleProfilePasswordSave}
                onLogout={handleLogout}
                onSwitchAccount={handleSwitchAccount}
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

        <aside className="hidden lg:sticky lg:top-32 lg:block lg:h-fit lg:self-start lg:border-l lg:border-slate-200 lg:pl-4">
          {activeView === 'post' && (
            <div className="soft-card overflow-hidden p-4">
              <div className="rounded-[26px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.45),_rgba(255,255,255,0.96)_58%)] p-4">
                <div className="space-y-3">
                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Most agreed</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {activePostAiStatus === 'loading' && 'Generating summary...'}
                      {activePostAiStatus === 'error' && 'AI summary is unavailable right now.'}
                      {activePostAiStatus === 'success' && (activePostConsensus?.most_agreed || 'No strong solution has emerged yet.')}
                      {activePostAiStatus === 'idle' && 'Generating summary...'}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Common solution</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {activePostAiStatus === 'loading' && 'Combining the most common ideas...'}
                      {activePostAiStatus === 'error' && 'AI summary is unavailable right now.'}
                      {activePostAiStatus === 'success' && (activePostConsensus?.common_solution || 'Common solution is still forming.')}
                      {activePostAiStatus === 'idle' && 'Combining the most common ideas...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView !== 'post' && (
            <div className="soft-card p-4">
              <p className="px-2 text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">{preferredTrendingHeading}</p>
              <p className="mt-1 px-2 text-xs text-slate-400">{preferredTrendingDescription}</p>
              <div className="mt-3 space-y-2">
                {preferredTrendingPosts.map((post, index) => (
                  <button
                    key={`${post.id}-trend-rail`}
                    type="button"
                    onClick={() => {
                      setActivePostId(post.id);
                      setActiveView('post');
                    }}
                    className="signal-tile w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition hover:bg-slate-100"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">#{index + 1} Trending</p>
                    <p className="mt-1 text-[15px] font-semibold leading-5 text-slate-900">{post.title}</p>
                    <p className="mt-1.5 text-sm text-slate-500">{formatCount(post.support)} supports</p>
                  </button>
                ))}
                {preferredTrendingPosts.length === 0 && (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                    {preferredTrendingEmptyLabel}
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>

      </main>

      <GenderPromptModal
        error={genderPromptError}
        isOpen={isGenderPromptOpen}
        isSubmitting={isGenderPromptSubmitting}
        onChange={setGenderPromptValue}
        onClose={handleGenderPromptClose}
        onSubmit={handleGenderPromptSubmit}
        username={userProfile?.displayName || userProfile?.username || 'there'}
        value={genderPromptValue}
      />

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-md lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="mx-auto flex max-w-xl items-center justify-around gap-1 px-2 py-1.5">
          {navItems.map((item) => {
            const Icon = item.Icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`mobile-nav-pill flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] font-semibold transition-all ${isActive ? 'mobile-nav-pill--active ' : ''
                  }${isActive ? 'text-blue-700' : 'text-slate-400 active:scale-95'
                  }`}
              >
                <Icon className={`nav-pill__icon h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
                {isActive && <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-600" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function GenderPromptModal({
  error,
  isOpen,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  username,
  value,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_32px_80px_-40px_rgba(15,23,42,0.55)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Profile setup</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">One quick detail</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {`You're in, ${username}. Choose your gender now that your content is visible.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close gender prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Gender</span>
            <select
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={isSubmitting}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save gender'}
            </button>
          </div>
        </form>
      </div>
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
  onOpenConnections,
  onCreateReport,
  onOpenSettings,
  onToggleFollow,
  onShareProfile,
  onOpenLatestPost,
  onOpenPost,
}) {
  return (
    <>
      <div className="motion-fade-up profile-hero overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.32)] sm:rounded-[32px]">
        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.98),_rgba(239,246,255,0.94))] px-4 py-4 sm:px-7 sm:py-6">
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

            <div className="signal-score w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left sm:w-auto sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Signal score</p>
              <p className="mt-1 font-display text-2xl font-bold text-slate-950 sm:text-3xl">{profileImpactScore}%</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {viewedProfilePhotoUrl ? (
                <img
                  src={viewedProfilePhotoUrl}
                  alt={`${profileDisplay.username} profile`}
                  className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-[0_16px_34px_-26px_rgba(15,23,42,0.32)] sm:h-24 sm:w-24"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-slate-900 text-3xl font-bold uppercase text-white shadow-[0_16px_34px_-26px_rgba(15,23,42,0.32)] sm:h-24 sm:w-24 sm:text-4xl">
                  {profileInitials}
                </div>
              )}

              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[28px] font-bold leading-tight text-slate-950 sm:text-[34px]">{profileDisplay.username}</h2>
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

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenSettings('personal')}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:justify-start"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={onCreateReport}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto sm:justify-start"
                    >
                      <SquarePen className="h-4 w-4" />
                      New report
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onToggleFollow}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto sm:justify-start ${isFollowingViewedProfile
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
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto sm:justify-start"
                  >
                    <Share2 className="h-4 w-4" />
                    {profileShareFeedback || 'Share profile'}
                  </button>
                  {latestProfilePost && (
                    <button
                      type="button"
                      onClick={onOpenLatestPost}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 sm:w-auto sm:justify-start"
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

        <div className="grid grid-cols-2 gap-3 px-4 py-3 sm:px-7 sm:py-4 md:grid-cols-2 xl:grid-cols-5">
          <ProfileStatPill
            icon={<Users className="h-4 w-4" />}
            label="Followers"
            value={formatCount(profileFollowersCount)}
            onClick={() => onOpenConnections('followers')}
          />
          <ProfileStatPill
            icon={<UserPlus className="h-4 w-4" />}
            label="Following"
            value={formatCount(profileFollowingCount)}
            onClick={() => onOpenConnections('following')}
          />
          <ProfileStatPill icon={<Bookmark className="h-4 w-4" />} label="Reports" value={formatCount(profileDisplay.postsCount)} hint="Published threads" />
          <ProfileStatPill icon={<Lightbulb className="h-4 w-4" />} label="Solutions" value={formatCount(profileDisplay.solutionsProposed)} hint="Idea drops" />
          <ProfileStatPill icon={<Zap className="h-4 w-4" />} label="Reputation" value={formatCount(profileDisplay.reputation)} hint="Community-earned signal" />
        </div>
      </div>

      <div className="motion-fade-up space-y-5" style={{ '--motion-delay': '120ms' }}>
        <div className="soft-card p-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'reports', label: 'Reports', count: profilePosts.length },
              { id: 'solutions', label: 'Solutions', count: profileSolutions.length },
              { id: 'activity', label: 'Activity', count: profileActivityFeed.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`nav-pill rounded-xl px-4 py-3 text-left transition ${profileTab === tab.id
                  ? 'nav-pill--active bg-slate-900 text-white'
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
            {profilePosts.map((post, index) => (
              <ProfileReportCard
                key={`${post.id}-profile-card`}
                post={post}
                delayMs={110 + (index * 65)}
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
            {profileSolutions.map((solution, index) => (
              <ProfileSolutionCard
                key={`${solution.postId}-${solution.solutionIndex}-${solution.key}`}
                solution={solution}
                delayMs={110 + (index * 65)}
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
            {profileActivityFeed.map((activity, index) => (
              <ProfileActivityCard
                key={activity.id}
                activity={activity}
                delayMs={110 + (index * 65)}
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

      </div>
    </>
  );
}

function ProfileStatPill({ icon, label, value, hint, onClick }) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="signal-metric rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.9)]">
            {icon}
          </span>
        </div>
        <p className="mt-2 font-display text-xl font-bold text-slate-950 sm:text-2xl">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{hint}</p> : null}
        {hint ? <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">View list</p> : null}
      </button>
    );
  }

  return (
    <div className="signal-metric rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-600 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.9)]">
          {icon}
        </span>
      </div>
      <p className="mt-2 font-display text-xl font-bold text-slate-950 sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500 sm:text-sm">{hint}</p> : null}
    </div>
  );
}

function ProfileConnectionsModal({
  isOpen,
  type,
  profileUsername,
  status,
  items,
  error,
  viewerUsername,
  isFollowSubmittingByUsername,
  onClose,
  onOpenProfile,
  onToggleFollow,
}) {
  if (!isOpen) return null;

  const title = type === 'following' ? 'Following' : 'Followers';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="motion-pop max-h-[82vh] w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{title}</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-slate-950">@{profileUsername}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close connections list"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(82vh-92px)] overflow-y-auto px-5 py-5 sm:px-6">
          {status === 'loading' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">
              Loading {title.toLowerCase()}...
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-medium text-red-700">
              {error || `Unable to load ${title.toLowerCase()}.`}
            </div>
          )}

          {status === 'success' && items.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-900">No {title.toLowerCase()} yet</p>
              <p className="mt-1 text-sm text-slate-500">
                {type === 'following'
                  ? `@${profileUsername} has not followed anyone yet.`
                  : `No one is following @${profileUsername} yet.`}
              </p>
            </div>
          )}

          {status === 'success' && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => {
                const isOwnItem = !!viewerUsername && item.username === viewerUsername;
                const isSubmitting = !!isFollowSubmittingByUsername[item.username];

                return (
                  <div
                    key={`${type}-${item.username}`}
                    className="signal-tile flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenProfile(item.username)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {item.profilePhotoUrl ? (
                        <img
                          src={item.profilePhotoUrl}
                          alt={`${item.username} profile`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-sm font-bold uppercase text-white">
                          {getInitials(item.username)}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{item.username}</p>
                        <p className="truncate text-sm text-slate-500">{item.role}</p>
                      </div>
                    </button>

                    {isOwnItem ? (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        You
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onToggleFollow(item.username)}
                        disabled={isSubmitting}
                        className={`inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition sm:min-w-[108px] sm:w-auto ${item.isFollowing
                          ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                          } ${isSubmitting ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {isSubmitting ? 'Updating...' : item.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeSwitch({ checked, onChange, label = 'Theme', compact = false }) {
  const switchId = useId();
  const wrapperClassName = compact ? 'theme-switch theme-switch--compact' : 'theme-switch';

  return (
    <div className={wrapperClassName}>
      {!compact && <span className="theme-switch__label">{label}</span>}
      <div className="theme-switch__toggle-wrap">
        <input
          id={switchId}
          className="theme-switch__input"
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label={checked ? 'Switch to light theme' : 'Switch to dark theme'}
        />
        <label className="theme-switch__toggle" htmlFor={switchId}>
          <span className="theme-switch__handler">
            <span className="theme-switch__crater theme-switch__crater--1" />
            <span className="theme-switch__crater theme-switch__crater--2" />
            <span className="theme-switch__crater theme-switch__crater--3" />
          </span>
          <span className="theme-switch__star theme-switch__star--1" />
          <span className="theme-switch__star theme-switch__star--2" />
          <span className="theme-switch__star theme-switch__star--3" />
          <span className="theme-switch__star theme-switch__star--4" />
          <span className="theme-switch__star theme-switch__star--5" />
          <span className="theme-switch__star theme-switch__star--6" />
        </label>
      </div>
    </div>
  );
}

function ProfileSettingsModal({
  isOpen,
  activeSection,
  status,
  isSubmitting,
  profile,
  profilePhotoUrl,
  profileJoinLabel,
  nameDraft,
  usernameDraft,
  passwordDraft,
  onClose,
  onSectionChange,
  onEditPhoto,
  onNameDraftChange,
  onUsernameDraftChange,
  onPasswordDraftChange,
  onSaveName,
  onSaveUsername,
  onSavePassword,
  onLogout,
  onSwitchAccount,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const nameInputRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setIsEditingName(false);
      setIsEditingUsername(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (status?.type !== 'success') return;
    setIsEditingName(false);
    setIsEditingUsername(false);
  }, [status?.type, status?.message]);

  if (!isOpen || !profile) return null;

  const sections = [
    { id: 'personal', label: 'Personal details', Icon: Users },
    { id: 'change-password', label: 'Change password', Icon: ShieldCheck },
    { id: 'switch-account', label: 'Switch account', Icon: UserPlus },
    { id: 'logout', label: 'Logout', Icon: LogOut },
  ];

  const profileRows = [
    ['Email', profile.email || 'Not added'],
    ['Phone', profile.phoneNumber || 'Not added'],
    ['Gender', profile.gender || 'Not set'],
    ['Role', profile.role || 'User'],
    ['Joined', profileJoinLabel || 'Recently'],
  ];

  let sectionContent = null;

  if (activeSection === 'personal') {
    sectionContent = (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {profilePhotoUrl ? (
              <img src={profilePhotoUrl} alt={profile.username} className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold uppercase text-white">
                {getInitials(profile.username)}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-950">{profile.displayName || profile.username}</p>
              <p className="mt-1 text-sm text-slate-500">@{profile.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onEditPhoto}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <ImageIcon className="h-4 w-4" />
            Change photo
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <form onSubmit={onSaveName} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Display name</p>
                <p className="mt-1 text-xs text-slate-500">
                  {isEditingName ? 'Edit mode is on for this field.' : 'Click the pen icon to edit this field.'}
                </p>
              </div>
              <button
                type={isEditingName ? 'submit' : 'button'}
                onClick={isEditingName ? undefined : () => {
                  setIsEditingName(true);
                  setTimeout(() => nameInputRef.current?.focus(), 0);
                }}
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={isEditingName ? 'Save display name' : 'Edit display name'}
              >
                <SquarePen className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={nameInputRef}
              value={nameDraft}
              onChange={(event) => onNameDraftChange(event.target.value)}
              className={`form-input mt-3 ${!isEditingName ? 'cursor-default border-slate-200 bg-slate-100 text-slate-500 focus:translate-y-0 focus:ring-0' : ''}`}
              placeholder="Your public name"
              disabled={isSubmitting || !isEditingName}
              readOnly={!isEditingName}
            />
          </form>

          <form onSubmit={onSaveUsername} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Username</p>
                <p className="mt-1 text-xs text-slate-500">
                  {isEditingUsername ? 'Edit mode is on for this field.' : 'Click the pen icon to edit this field.'}
                </p>
              </div>
              <button
                type={isEditingUsername ? 'submit' : 'button'}
                onClick={isEditingUsername ? undefined : () => {
                  setIsEditingUsername(true);
                  setTimeout(() => usernameInputRef.current?.focus(), 0);
                }}
                disabled={isSubmitting}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={isEditingUsername ? 'Save username' : 'Edit username'}
              >
                <SquarePen className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={usernameInputRef}
              value={usernameDraft}
              onChange={(event) => onUsernameDraftChange(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              className={`form-input mt-3 ${!isEditingUsername ? 'cursor-default border-slate-200 bg-slate-100 text-slate-500 focus:translate-y-0 focus:ring-0' : ''}`}
              placeholder="choose_username"
              disabled={isSubmitting || !isEditingUsername}
              readOnly={!isEditingUsername}
            />
          </form>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {profileRows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeSection === 'change-password') {
    sectionContent = profile.canChangePassword ? (
      <form className="space-y-4" onSubmit={onSavePassword}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Current password</span>
          <input
            type="password"
            value={passwordDraft.currentPassword}
            onChange={(event) => onPasswordDraftChange((current) => ({ ...current, currentPassword: event.target.value }))}
            className="form-input"
            placeholder="Current password"
            disabled={isSubmitting}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">New password</span>
          <input
            type="password"
            value={passwordDraft.newPassword}
            onChange={(event) => onPasswordDraftChange((current) => ({ ...current, newPassword: event.target.value }))}
            className="form-input"
            placeholder="New password"
            disabled={isSubmitting}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Confirm new password</span>
          <input
            type="password"
            value={passwordDraft.confirmPassword}
            onChange={(event) => onPasswordDraftChange((current) => ({ ...current, confirmPassword: event.target.value }))}
            className="form-input"
            placeholder="Confirm new password"
            disabled={isSubmitting}
          />
        </label>
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Updating...' : 'Update password'}
        </button>
      </form>
    ) : (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        Password changes are only available for accounts created with email and password.
      </div>
    );
  }

  if (activeSection === 'switch-account') {
    sectionContent = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Log out of the current account and jump back to the sign-in screen so you can continue with another profile.
        </div>
        <button type="button" onClick={onSwitchAccount} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
          <UserPlus className="h-4 w-4" />
          Switch account
        </button>
      </div>
    );
  }

  if (activeSection === 'logout') {
    sectionContent = (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          This signs you out of Public Policy Hub on this device.
        </div>
        <button type="button" onClick={onLogout} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-slate-950/55 px-4 py-1 backdrop-blur-sm sm:py-3" onClick={onClose}>
      <div
        className="motion-pop max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_32px_90px_-42px_rgba(15,23,42,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Profile settings</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-slate-950">@{profile.username}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid max-h-[calc(88vh-82px)] gap-0 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="max-h-full overflow-y-auto border-b border-slate-200 bg-slate-50/80 p-3 lg:border-b-0 lg:border-r">
            <div className="grid gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${activeSection === section.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <section.Icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="max-h-full overflow-y-auto px-5 py-5 sm:px-6">
            {status?.message && (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                }`}>
                {status.message}
              </div>
            )}
            {sectionContent}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileActivityCard({ activity, delayMs = 0, onOpenPost }) {
  const isReport = activity.kind === 'report';

  return (
    <article className="soft-card signal-card overflow-hidden p-4 sm:p-5" style={{ '--motion-delay': `${delayMs}ms` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${isReport ? 'text-blue-700' : 'text-amber-700'}`}>
            {activity.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-[22px] font-bold leading-tight text-slate-950 sm:text-[26px]">{activity.title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">{activity.preview}</p>
        </div>

        <button
          type="button"
          onClick={onOpenPost}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
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

function BookmarkedPostCard({ delayMs = 0, post, onOpenPost, onOpenAuthor, onToggleSave }) {
  const { previewText } = getDescriptionPreview(post.description, false, 160);

  return (
    <article className="soft-card signal-card p-5 transition hover:shadow-[0_16px_38px_-28px_rgba(15,23,42,0.38)]" style={{ '--motion-delay': `${delayMs}ms` }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 rounded-xl text-left">
          <button
            type="button"
            onClick={onOpenAuthor}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-bold uppercase text-white transition hover:bg-slate-800"
          >
            {getInitials(post.author)}
          </button>
          <div>
            <button
              type="button"
              onClick={onOpenAuthor}
              className="text-sm font-semibold text-slate-900 transition hover:text-blue-700"
            >
              {post.author}
            </button>
            <p className="text-xs text-slate-500">{formatPostTimestamp(post)}</p>
          </div>
        </div>

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

function LocationTrendSection({ title, posts, emptyLabel, onOpenPost }) {
  return (
    <div>
      <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <div className="mt-2 space-y-2">
        {posts.map((post, index) => (
          <button
            key={`${post.id}-${title}`}
            type="button"
            onClick={() => onOpenPost(post.id)}
            className="signal-tile w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-left transition hover:bg-white"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700">#{index + 1} Trending</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-900">{post.title}</p>
            <p className="mt-2 text-xs text-slate-500">{formatCount(post.support)} supports</p>
          </button>
        ))}

        {posts.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileReportCard({ delayMs = 0, post, onOpenPost }) {
  const { previewText } = getDescriptionPreview(post.description, false, 170);

  return (
    <article className="soft-card signal-card overflow-hidden p-5" style={{ '--motion-delay': `${delayMs}ms` }}>
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
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{formatPostTimestamp(post)}</p>
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

function ProfileSolutionCard({ delayMs = 0, solution, onOpenPost }) {
  return (
    <article className="soft-card signal-card p-5" style={{ '--motion-delay': `${delayMs}ms` }}>
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
    <div className="soft-card signal-card p-8 text-center">
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

function getMotionDelayStyle(index, base = 0, step = 70) {
  return {
    '--motion-delay': `${base + (index * step)}ms`,
  };
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
  const [isMuted, setIsMuted] = useState(true);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.paused) {
              video.play().catch(() => { });
            }
          } else {
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      { threshold: 0.55 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => { });
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
      if (wasPlaying) updatedVideo.play().catch(() => { });
      video.removeEventListener('loadedmetadata', onMetadataLoaded);
    };

    video.addEventListener('loadedmetadata', onMetadataLoaded);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement === container) {
      await document.exitFullscreen().catch(() => { });
      return;
    }

    if (container.requestFullscreen) {
      await container.requestFullscreen().catch(() => { });
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
        autoPlay
        muted={isMuted}
        loop
        onClick={(event) => {
          event.stopPropagation();
          togglePlayPause();
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,_rgba(2,6,23,0.06)_35%,_rgba(2,6,23,0.86)_100%)]"
      />

      <div className="absolute right-3 top-3 z-20 hidden sm:block pointer-events-auto">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setIsSettingsOpen((current) => !current); }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 text-white backdrop-blur"
          aria-label="Open video settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {isSettingsOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900/95 p-2 text-white shadow-xl pointer-events-auto">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Quality</p>
            {sourceOptions.map((option) => (
              <button
                key={`${option.value}-${option.label}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); onChangeQuality(option.value); }}
                className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm ${selectedQuality === option.value ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
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
                  onClick={(e) => { e.stopPropagation(); onChangePlaybackRate(speed); }}
                  className={`rounded-md px-1 py-1 text-xs font-semibold ${playbackRate === speed ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-20 p-3 pointer-events-none">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || currentTime)}
          onClick={(e) => e.stopPropagation()}
          onChange={onSeek}
          className="pointer-events-auto w-full h-1.5 cursor-pointer appearance-none rounded-full bg-slate-600 accent-blue-500 outline-none"
          aria-label={`Seek video ${title}`}
        />

        <div className="mt-2 flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
            className="pointer-events-auto hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur sm:flex"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
            className="pointer-events-auto flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur"
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
            onClick={(e) => e.stopPropagation()}
            onChange={onVolumeChange}
            className="pointer-events-auto hidden w-20 cursor-pointer accent-blue-500 sm:block"
            aria-label="Adjust volume"
          />

          <div className="pointer-events-auto hidden items-center gap-1 rounded-full border border-white/35 bg-slate-900/55 px-2 py-1 backdrop-blur sm:flex">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-300">Q</span>
            <select
              value={activeQualityOption?.value ?? 'auto'}
              onClick={(e) => e.stopPropagation()}
              onChange={(event) => onChangeQuality(event.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer"
              aria-label="Select video quality"
            >
              {sourceOptions.map((option) => (
                <option key={`bar-${option.value}`} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p className="ml-auto text-[10px] font-semibold text-slate-200 sm:text-xs">
            {formatMediaTime(currentTime)} / {formatMediaTime(duration)}
          </p>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="pointer-events-auto hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/35 bg-slate-900/55 backdrop-blur sm:flex"
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

function normalizeSearchQuery(value) {
  return `${value ?? ''}`.trim().toLowerCase().replace(/\s+/g, ' ');
}

function matchesSearchTerms(sourceText, normalizedQuery) {
  const normalizedSourceText = normalizeSearchQuery(sourceText);
  const normalizedTerms = normalizeSearchQuery(normalizedQuery).split(' ').filter(Boolean);
  if (normalizedTerms.length === 0) return true;
  return normalizedTerms.every((term) => normalizedSourceText.includes(term));
}

function getPostSearchDocument(post) {
  return [
    post?.title,
    post?.description,
    post?.department,
    post?.tag,
    post?.author,
    post?.location,
    ...(Array.isArray(post?.fixes) ? post.fixes : []),
    ...getPostSolutions(post).map((solution) => solution.text),
  ].filter(Boolean).join(' ');
}

function postMatchesSearchQuery(post, normalizedQuery) {
  if (!normalizeSearchQuery(normalizedQuery)) return true;
  return matchesSearchTerms(getPostSearchDocument(post), normalizedQuery);
}

function getPostSearchRank(post, normalizedQuery) {
  const query = normalizeSearchQuery(normalizedQuery);
  if (!query) return 0;

  const title = normalizeSearchQuery(post?.title);
  const description = normalizeSearchQuery(post?.description);
  const department = normalizeSearchQuery(post?.department);
  const tag = normalizeSearchQuery(post?.tag);
  const author = normalizeSearchQuery(post?.author);
  const location = normalizeSearchQuery(post?.location);
  let score = 0;

  if (title === query) score += 120;
  else if (title.startsWith(query)) score += 84;
  else if (title.includes(query)) score += 60;

  if (tag === query) score += 92;
  else if (tag.includes(query)) score += 62;

  if (department === query) score += 88;
  else if (department.includes(query)) score += 58;

  if (author === query) score += 82;
  else if (author.startsWith(query)) score += 56;
  else if (author.includes(query)) score += 42;

  if (location.includes(query)) score += 24;
  if (description.includes(query)) score += 18;
  score += Math.min(getTrendingScore(post), 5000) / 1000;

  return score;
}

function getAccountSearchDocument(account) {
  return [
    account?.username,
    account?.displayName,
    account?.role,
  ].filter(Boolean).join(' ');
}

function accountMatchesSearchQuery(account, normalizedQuery) {
  if (!normalizeSearchQuery(normalizedQuery)) return true;
  return matchesSearchTerms(getAccountSearchDocument(account), normalizedQuery);
}

function getAccountSearchRank(account, normalizedQuery) {
  const query = normalizeSearchQuery(normalizedQuery);
  if (!query) return 0;

  const username = normalizeSearchQuery(account?.username);
  const displayName = normalizeSearchQuery(account?.displayName);
  const role = normalizeSearchQuery(account?.role);
  let score = 0;

  if (username === query) score += 120;
  else if (username.startsWith(query)) score += 86;
  else if (username.includes(query)) score += 60;

  if (displayName === query) score += 96;
  else if (displayName.startsWith(query)) score += 72;
  else if (displayName.includes(query)) score += 48;

  if (role.includes(query)) score += 20;
  score += Math.min(toCount(account?.followerCount), 5000) / 1000;
  score += Math.min(toCount(account?.postsCount), 500) / 100;

  return score;
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

function formatPostTimestamp(post) {
  const createdAtValue = post?.createdAt ?? post?.created_at;
  if (!createdAtValue) {
    const legacyTime = `${post?.time ?? ''}`.trim();
    return legacyTime || 'Recently';
  }

  const date = new Date(createdAtValue);
  if (Number.isNaN(date.getTime())) {
    const legacyTime = `${post?.time ?? ''}`.trim();
    return legacyTime || 'Recently';
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return 'Just now';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getNotificationTypeLabel(type) {
  const normalizedType = `${type ?? ''}`.trim().toLowerCase();

  if (normalizedType === 'follow') return 'New follower';
  if (normalizedType === 'support') return 'Support';
  if (normalizedType === 'comment') return 'Comment';
  if (normalizedType === 'solution') return 'Solution';
  if (normalizedType === 'solution_reply') return 'Reply';
  if (normalizedType === 'solution_upvote') return 'Upvote';
  if (normalizedType === 'solution_downvote') return 'Downvote';
  if (normalizedType === 'share') return 'Share';
  return 'Update';
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

function isRelatedLocation(firstLocation, secondLocation) {
  const normalizeLocation = (value) => `${value ?? ''}`.trim().toLowerCase();
  const firstNormalized = normalizeLocation(firstLocation);
  const secondNormalized = normalizeLocation(secondLocation);

  if (!firstNormalized || !secondNormalized) return false;
  if (firstNormalized === secondNormalized) return true;

  const firstPrimary = firstNormalized.split(',')[0]?.trim() || '';
  const secondPrimary = secondNormalized.split(',')[0]?.trim() || '';
  return !!firstPrimary && firstPrimary === secondPrimary;
}

function parseLocationHierarchy(location) {
  const normalizedLocation = `${location ?? ''}`.trim();
  if (!normalizedLocation) {
    return {
      locationLabel: '',
      city: '',
      state: '',
    };
  }

  const parts = normalizedLocation.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return {
      locationLabel: normalizedLocation,
      city: normalizedLocation,
      state: normalizedLocation,
    };
  }

  if (parts.length === 1) {
    return {
      locationLabel: parts[0],
      city: parts[0],
      state: parts[0],
    };
  }

  return {
    locationLabel: normalizedLocation,
    city: parts[Math.max(parts.length - 2, 0)] || parts[0],
    state: parts[parts.length - 1] || parts[0],
  };
}

function buildLocationScopeTrends(posts, locationContext, scope, excludedPostIds = new Set()) {
  if (!locationContext) return [];

  const exactLabel = `${locationContext.locationLabel ?? ''}`.trim().toLowerCase();
  const cityLabel = `${locationContext.city ?? ''}`.trim().toLowerCase();
  const stateLabel = `${locationContext.state ?? ''}`.trim().toLowerCase();

  return [...(Array.isArray(posts) ? posts : [])]
    .filter((post) => !excludedPostIds.has(post.id))
    .filter((post) => {
      const postLocation = parseLocationHierarchy(post.location);
      const postExact = `${postLocation.locationLabel ?? ''}`.trim().toLowerCase();
      const postCity = `${postLocation.city ?? ''}`.trim().toLowerCase();
      const postState = `${postLocation.state ?? ''}`.trim().toLowerCase();

      if (scope === 'location') return !!exactLabel && postExact === exactLabel;
      if (scope === 'city') return !!cityLabel && postCity === cityLabel;
      if (scope === 'state') return !!stateLabel && postState === stateLabel;
      return false;
    })
    .sort((a, b) => getTrendingScore(b) - getTrendingScore(a));
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
    chips: [post.location, post.department, formatPostTimestamp(post)].filter(Boolean),
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

function formatMemberSinceLabel(value, fallbackUsername = '') {
  const parsedDate = value ? new Date(value) : null;
  if (parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }

  const normalized = `${fallbackUsername ?? ''}`.trim().toLowerCase();
  if (!normalized) return 'recently';

  const total = [...normalized].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const year = 2022 + (total % 4);
  const monthIndex = total % 12;
  const fallbackDate = new Date(Date.UTC(year, monthIndex, 1));

  return fallbackDate.toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function formatMembershipDuration(value) {
  const parsedDate = value ? new Date(value) : null;
  if (!(parsedDate instanceof Date) || Number.isNaN(parsedDate.getTime())) return 'New';

  const now = new Date();
  let monthDiff = ((now.getFullYear() - parsedDate.getFullYear()) * 12) + (now.getMonth() - parsedDate.getMonth());
  if (now.getDate() < parsedDate.getDate()) monthDiff -= 1;

  if (monthDiff <= 0) return 'New';
  if (monthDiff < 12) return `${monthDiff} mo`;

  const years = Math.floor(monthDiff / 12);
  const remainingMonths = monthDiff % 12;
  if (remainingMonths === 0) return `${years} yr`;
  return `${years}.${remainingMonths} yr`;
}

function mergeUniquePosts(...groups) {
  const seenPostIds = new Set();

  return groups.flatMap((group) => (
    Array.isArray(group) ? group : []
  )).filter((post) => {
    const postId = `${post?.id ?? ''}`.trim();
    if (!postId || seenPostIds.has(postId)) return false;
    seenPostIds.add(postId);
    return true;
  });
}

function getProfileJoinLabel(usernameOrDate, fallbackUsername = '') {
  return formatMemberSinceLabel(usernameOrDate, fallbackUsername);
}

function shouldUseGoogleRedirect() {
  if (typeof window === 'undefined') return false;

  // Force popup auth on forwarded/tunneled/localhost domains because
  // signInWithRedirect redirects to Firebase authDomain and never returns
  // to the tunneled URL, causing the user to appear signed-out.
  const hostname = window.location.hostname || '';
  const isForwardedOrLocal =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.devtunnels.ms') ||
    hostname.endsWith('.ngrok.io') ||
    hostname.endsWith('.ngrok-free.app') ||
    hostname.endsWith('.loca.lt') ||
    hostname.endsWith('.trycloudflare.com');
  if (isForwardedOrLocal) return false;

  const touchDevice = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const mobileBrowser = /android|iphone|ipad|ipod|mobile/i.test(window.navigator?.userAgent ?? '');
  return touchDevice || mobileBrowser;
}
function storeGoogleAuthMode(mode) {
  if (typeof window === 'undefined') return;
  const normalizedMode = `${mode ?? 'login'}`.trim().toLowerCase() === 'signup' ? 'signup' : 'login';
  window.sessionStorage.setItem(GOOGLE_AUTH_MODE_STORAGE_KEY, normalizedMode);
  window.localStorage.setItem(GOOGLE_AUTH_MODE_STORAGE_KEY, normalizedMode);
}

function getStoredGoogleAuthMode() {
  if (typeof window === 'undefined') return 'login';
  const storedMode = window.sessionStorage.getItem(GOOGLE_AUTH_MODE_STORAGE_KEY)
    || window.localStorage.getItem(GOOGLE_AUTH_MODE_STORAGE_KEY);
  return storedMode === 'signup' ? 'signup' : 'login';
}

function clearStoredGoogleAuthMode() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(GOOGLE_AUTH_MODE_STORAGE_KEY);
  window.localStorage.removeItem(GOOGLE_AUTH_MODE_STORAGE_KEY);
}

function getGoogleAuthErrorMessage(error) {
  const errorCode = `${error?.code ?? ''}`.trim();

  if (errorCode === 'auth/unauthorized-domain') {
    return 'Google sign-in needs this forwarded domain added to Firebase Authorized Domains first.';
  }

  if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user') {
    return 'Google sign-in was interrupted. On mobile, try again and the app will continue with redirect sign-in.';
  }

  return error?.message || 'Unable to continue with Google.';
}
export default App;
