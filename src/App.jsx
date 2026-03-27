import { createElement, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  House,
  Image as ImageIcon,
  Lightbulb,
  MapPin,
  MapPinned,
  MessageSquare,
  Play,
  Search,
  ShieldAlert,
  SquarePen,
  Star,
  TrendingUp,
  User,
  Users,
  Video as VideoIcon,
  Vote,
  LogOut,
  X,
} from 'lucide-react';

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
  { id: 'home', label: 'Home', icon: House },
  { id: 'map', label: 'Map', icon: MapPinned },
  { id: 'create', label: 'Post', icon: SquarePen, requiresAuth: true },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User, requiresAuth: true },
];

const feedTabs = ['Trending', 'Verified', 'Nearby', 'Solutions'];

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

const defaultCities = [
  { city: 'Delhi', issues: 120, topic: 'Ticketing scams' },
  { city: 'Mumbai', issues: 95, topic: 'Drainage and roads' },
  { city: 'Patna', issues: 40, topic: 'Traffic corruption' },
  { city: 'Bengaluru', issues: 67, topic: 'Bus gaps' },
];

const defaultNotifications = [
  'New comment on your Patna checkpoint post',
  'Your solution reached 50 upvotes',
  'Issue verified by community moderators',
];

function App() {
  const [activeView, setActiveView] = useState('home');
  const [activeFeed, setActiveFeed] = useState('Trending');
  const [selectedId, setSelectedId] = useState(null);
  const [apiPosts, setApiPosts] = useState(defaultPosts);
  const [apiCities, setApiCities] = useState(defaultCities);
  const [apiNotifications, setApiNotifications] = useState(defaultNotifications);
  const [isLoading, setIsLoading] = useState(true);

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [mediaSlideIndexByPost, setMediaSlideIndexByPost] = useState({});
  const [commentInput, setCommentInput] = useState('');
  const [solutionInput, setSolutionInput] = useState('');
  const [isInteractionSubmitting, setIsInteractionSubmitting] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileViewUsername, setProfileViewUsername] = useState(null);
  const profileMenuRef = useRef(null);
  const profilePhotoInputRef = useRef(null);

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

  const normalizePost = (post) => ({
    ...post,
    support: toCount(post?.support),
    comments: toCount(post?.comments),
    solutions: toCount(post?.solutions),
    shares: toCount(post?.shares),
    supporters: Array.isArray(post?.supporters) ? post.supporters : [],
    commentsList: Array.isArray(post?.commentsList) ? post.commentsList : [],
    solutionsList: Array.isArray(post?.solutionsList) ? post.solutionsList : [],
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

  const ensureAuthenticated = () => {
    if (token && userProfile) return true;
    openAuthPage();
    return false;
  };

  const openAuthPage = () => {
    setAuthError('');
    setActiveView('auth');
  };

  const fetchPublicData = () => {
    return Promise.all([
      fetch(`${API_BASE_URL}/api/posts`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/cities`).then(res => res.json()),
      fetch(`${API_BASE_URL}/api/notifications`).then(res => res.json())
    ])
    .then(([postsData, citiesData, notifsData]) => {
      if (Array.isArray(postsData)) {
        const normalizedPosts = postsData.map(normalizePost);
        setApiPosts(normalizedPosts);
        setSelectedId((currentSelectedId) => currentSelectedId ?? normalizedPosts[0]?.id ?? null);
      }
      if (Array.isArray(citiesData)) setApiCities(citiesData);
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
    .then(data => setUserProfile(data))
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
    if (!userProfile?.username) {
      setProfilePhotoUrl('');
      return;
    }

    const storedPhoto = localStorage.getItem(`profilePhoto:${profileDisplay.username}`);
    setProfilePhotoUrl(storedPhoto || '');
  }, [userProfile?.username]);

  useEffect(() => {
    const closeMenuOnOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeMenuOnOutsideClick);
  }, []);

  const handleNavClick = (id) => {
    if ((id === 'profile' || id === 'create') && !userProfile && !token) {
      openAuthPage();
    } else {
      if (id === 'profile' && userProfile?.username) {
        setProfileViewUsername(userProfile.username);
      }
      setActiveView(id);
    }
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
    setIsProfileMenuOpen(false);
    setAuthError('');
    if (activeView === 'profile' || activeView === 'create') setActiveView('home');
  };

  const handleProfilePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.username) return;

    const reader = new FileReader();
    reader.onload = () => {
      const nextPhoto = typeof reader.result === 'string' ? reader.result : '';
      if (!nextPhoto) return;

      setProfilePhotoUrl(nextPhoto);
      localStorage.setItem(`profilePhoto:${profileDisplay.username}`, nextPhoto);
      setIsProfileMenuOpen(false);
    };
    reader.readAsDataURL(file);
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

  const handleSupport = async (postId) => {
    try {
      await updatePostInteraction(postId, 'support', null, true);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleShare = async (postId) => {
    try {
      const currentUrl = `${window.location.origin}${window.location.pathname}#post-${postId}`;
      if (navigator.share) {
        await navigator.share({ title: 'Public Policy Hub Post', url: currentUrl });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      }

      await updatePostInteraction(postId, 'share', null, false);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        alert(error.message || 'Failed to share post');
      }
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentInput.trim();
    if (!text) return;

    setIsInteractionSubmitting(true);
    try {
      await updatePostInteraction(postId, 'comments', { text }, true);
      setCommentInput('');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsInteractionSubmitting(false);
    }
  };

  const handleSolutionSubmit = async (postId) => {
    const text = solutionInput.trim();
    if (!text) return;

    setIsInteractionSubmitting(true);
    try {
      await updatePostInteraction(postId, 'solutions', { text }, true);
      setSolutionInput('');
    } catch (error) {
      alert(error.message);
    } finally {
      setIsInteractionSubmitting(false);
    }
  };

  const openAuthorProfile = (username) => {
    if (!username) return;
    setProfileViewUsername(username);
    setActiveView('profile');
  };

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-display font-semibold text-slate-500">Connecting to server...</div>;

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

  const visiblePosts = getVisiblePosts(activeFeed, apiPosts);
  const selectedPost = apiPosts.find((post) => post.id === selectedId) ?? visiblePosts[0] ?? apiPosts[0] ?? null;
  const resolvedProfileUsername = profileViewUsername || userProfile?.username || '';
  const isOwnProfile = !!userProfile && resolvedProfileUsername === userProfile.username;
  const authorPostsCount = resolvedProfileUsername ? apiPosts.filter((post) => post.author === resolvedProfileUsername).length : 0;
  const profileDisplay = isOwnProfile
    ? {
        username: userProfile.username,
        role: userProfile.role,
        postsCount: userProfile.postsCount,
        solutionsProposed: userProfile.solutionsProposed,
        reputation: userProfile.reputation,
        badgesCount: userProfile.badges.length,
        streak: userProfile.streak,
      }
    : {
        username: resolvedProfileUsername,
        role: 'CitizenReporter',
        postsCount: authorPostsCount,
        solutionsProposed: Math.max(Math.floor(authorPostsCount * 0.8), 1),
        reputation: 500 + authorPostsCount * 10,
        badgesCount: Math.max(Math.floor(authorPostsCount / 2), 1),
        streak: `${Math.max(authorPostsCount, 1)}d`,
      };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1500px] px-4 py-0 h-20 flex items-center">
          <div className="flex w-full items-center gap-2">
            <button type="button" onClick={() => setActiveView('home')} className="flex items-center gap-2">
              <img src={Logo} alt="Public Policy Hub Logo" style={{ height: '120px' }} className="relative z-10 w-auto object-contain transition-transform hover:scale-105 -my-5" />
              <div className="hidden sm:block">
                <p className="font-display text-xs uppercase tracking-[0.35em] text-slate-400">Public Policy Hub</p>
                <p className="text-sm text-slate-600">Civic issues, built like a modern social app</p>
              </div>
            </button>

            <label className="group relative hidden flex-1 lg:block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" />
              <input
                type="search"
                placeholder="Search issues, cities, departments"
                className="h-12 w-full rounded-full border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => handleNavClick('alerts')} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 mr-2">
                <Bell className="h-4 w-4" />
                <span className="notification-dot" />
              </button>
              {userProfile ? (
                 <>
                  <button onClick={() => handleNavClick('create')} className="hidden rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 sm:inline-flex">
                    Upload
                  </button>
                  <div className="relative" ref={profileMenuRef}>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePhotoUpload}
                    />
                    <button
                      onClick={() => setIsProfileMenuOpen((current) => !current)}
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 pr-3"
                    >
                      {isOwnProfile && profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold text-white uppercase">
                          {profileDisplay.username.substring(0,2)}
                        </span>
                      )}
                      <span className="hidden text-sm font-semibold sm:block">{profileDisplay.username}</span>
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                        <button
                          type="button"
                          onClick={() => profilePhotoInputRef.current?.click()}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit Profile Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (userProfile?.username) setProfileViewUsername(userProfile.username);
                            setActiveView('profile');
                            setIsProfileMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Settings
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
                <button onClick={openAuthPage} className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-slate-800 transition">
                  Sign In
                </button>
              )}
            </div>
          </div>

          <label className="group relative mt-1 lg:hidden">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" />
            <input
              type="search"
              placeholder="Search issues, cities, departments"
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-100 pl-11 pr-4 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>
      </header>

      <section className="mx-auto max-w-[1550px] px-4 pt-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_380px]">
          <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950 px-6 py-7 text-white shadow-[0_32px_100px_-42px_rgba(37,99,235,0.72)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,_rgba(255,255,255,0.22),_transparent_32%),radial-gradient(circle_at_100%_0%,_rgba(249,115,22,0.28),_transparent_20%)]" />
            <div className="relative">
              <div className="flex flex-wrap gap-2">
                <span className="glass-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Video-first</span>
                <span className="glass-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Community verified</span>
                <span className="glass-panel px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/85">Mobile-first</span>
              </div>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl">PPH makes civic reporting feel engaging, urgent, and shareable.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">A public issue feed inspired by Reddit, TikTok, and Instagram, but grounded in evidence, location, and action.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <MetricBox label="Uploads Today" value="3.4k" />
                <MetricBox label="Verified Reports" value="842" />
                <MetricBox label="Solutions Supported" value="12.8k" />
              </div>
            </div>
          </div>

          <div className="soft-card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Trending Now</p>
              <h2 className="mt-3 font-display text-2xl font-bold">Police Corruption</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">Short clips plus one clear fix are outperforming long complaint threads.</p>
              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                  <span>Patna hotspot</span>
                  <span>00:41</span>
                </div>
                <div className="mt-4 flex h-40 items-end rounded-[20px] bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.32),_transparent_35%),linear-gradient(160deg,_rgba(59,130,246,0.65),_rgba(15,23,42,0.95))] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Checkpoint footage is driving the conversation.</p>
                    <p className="mt-1 text-xs text-white/70">Support is climbing fastest on mobile.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                <QuickRow icon={Play} text="Autoplay preview frames" />
                <QuickRow icon={Vote} text="Pulse-style support interactions" />
                <QuickRow icon={MapPinned} text="Map-first issue discovery" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mobile-safe mx-auto grid max-w-[1550px] gap-6 px-4 pb-24 pt-4 lg:grid-cols-[250px_minmax(0,900px)] lg:justify-center">
        <aside className="hidden space-y-4 lg:block">
          <div className="soft-card p-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Navigation</p>
            <div className="mt-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left transition ${
                    activeView === item.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-3 font-semibold">
                    {createElement(item.icon, { className: 'h-4 w-4' })}
                    {item.label}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="soft-card p-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Channels</p>
            <div className="mt-4 space-y-2">
              {['Local Issues', 'Policy', 'Education', 'Corruption', 'Infrastructure'].map((channel) => (
                <div key={channel} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                  {channel}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {activeView === 'home' && (
            <>
              <div className="soft-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Community feed</p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Top civic posts with full media context</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {feedTabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveFeed(tab)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          activeFeed === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {visiblePosts.map((post, index) => (
                  <article
                    key={post.id}
                    onClick={() => setSelectedId(post.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedId(post.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`soft-card group cursor-pointer overflow-hidden p-4 transition hover:shadow-[0_26px_70px_-40px_rgba(15,23,42,0.25)] sm:p-5 animate-rise [animation-fill-mode:backwards] ${
                      selectedId === post.id ? 'ring-2 ring-blue-200' : ''
                    }`}
                    style={{ animationDelay: `${index * 90}ms` }}
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
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-xs font-bold uppercase text-white">
                          {post.author.slice(0, 2)}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{post.author}</p>
                          <p className="text-xs text-slate-500">{post.time}</p>
                        </div>
                      </button>
                      <div className="video-shell order-1 relative overflow-hidden rounded-[20px]">
                        {post.mediaList && post.mediaList.length > 0 ? (
                          <div
                            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                            onScroll={(event) => handleMediaScroll(post.id, event)}
                          >
                            {post.mediaList.map((media, i) => (
                              <div key={i} className="w-full h-full flex-shrink-0 snap-center relative">
                                {media.type === 'VIDEO' ? (
                                  <video src={`${API_BASE_URL}${media.url}`} className="h-full w-full object-contain bg-black" controls preload="metadata" playsInline />
                                ) : (
                                  <img src={`${API_BASE_URL}${media.url}`} alt={post.title} className="h-full w-full object-contain bg-slate-950" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className={`absolute inset-0 bg-gradient-to-br ${post.accent}`} />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.28),_transparent_26%),linear-gradient(180deg,_transparent_0%,_rgba(15,23,42,0.68)_100%)]" />
                            <div className="absolute left-4 top-4 rounded-full bg-slate-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">{post.media}</div>
                            <button className="pulse-ring absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                              <Play className="ml-1 h-7 w-7 fill-current" />
                            </button>
                          </>
                        )}
                      </div>
                      {post.mediaList && post.mediaList.length > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                          {post.mediaList.map((_, dotIndex) => (
                            <span
                              key={`${post.id}-dot-${dotIndex}`}
                              className={`h-2 w-2 rounded-full transition ${
                                (mediaSlideIndexByPost[post.id] ?? 0) === dotIndex ? 'bg-blue-600' : 'bg-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <div className="order-2 space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700"><MapPin className="h-3.5 w-3.5" />{post.location}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600"><Building2 className="h-3.5 w-3.5" />{post.department}</span>
                          {post.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                        </div>
                        <div>
                          <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-slate-950">{post.title}</h3>
                          <p className="mt-2 text-[15px] leading-7 text-slate-600">{post.description}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <MetricChip icon={TrendingUp} value={formatCount(post.support)} label="Support" primary />
                          <MetricChip icon={MessageSquare} value={formatCount(post.comments)} label="Comments" />
                          <MetricChip icon={Lightbulb} value={formatCount(post.solutions)} label="Solutions" />
                        </div>
                        <div className="rounded-[16px] bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Top Fix</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{post.fixes?.[0] || 'Awaiting suggested fixes'}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                <div className="soft-card p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Infinite feed</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-slate-950">More verified reports are loading</h3>
                  <div className="mt-5 space-y-3">
                    <div className="skeleton-line h-5 w-2/3" />
                    <div className="skeleton-line h-5 w-11/12" />
                    <div className="skeleton-line h-5 w-5/6" />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'map' && (
            <div className="soft-card overflow-hidden p-0">
              <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="relative overflow-hidden bg-slate-950 px-6 py-6 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.26),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.25),_transparent_28%)]" />
                  <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Issue map</p>
                    <h2 className="mt-3 font-display text-3xl font-bold">See where civic frustration is clustering across India.</h2>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {apiCities.map((city) => (
                        <div key={city.city} className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                          <p className="font-display text-xl font-bold">{city.city}</p>
                          <p className="mt-1 text-sm text-slate-300">{city.topic}</p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">{city.issues} issues</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Map View</p>
                  <div className="mt-4 space-y-3">
                    <InfoCard icon={MapPinned} title="Delhi" text="120 issues around ticketing, policing, and access." />
                    <InfoCard icon={MapPinned} title="Mumbai" text="95 issues tied to roads and drainage stress." />
                    <InfoCard icon={MapPinned} title="Patna" text="40 issues with checkpoint corruption." />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'create' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="soft-card p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Create New Issue</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Simple, mobile-friendly reporting.</h2>
                <form onSubmit={handlePostSubmit} className="mt-6 space-y-5">
                  <div className="space-y-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition">
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
                  <input type="text" placeholder="Title" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-300" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input type="text" placeholder="Location" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-300" value={postForm.location} onChange={e => setPostForm({...postForm, location: e.target.value})} />
                    <select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-300" value={postForm.department} onChange={e => setPostForm({...postForm, department: e.target.value})}>
                        <option>General</option><option>Police</option><option>Municipality</option><option>Education</option><option>Transport</option>
                    </select>
                  </div>
                  <textarea rows="5" placeholder="Description" required className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold outline-none focus:border-blue-300 min-h-[140px] resize-none" value={postForm.description} onChange={e => setPostForm({...postForm, description: e.target.value})} />
                  <button type="submit" className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 cursor-pointer">Post Issue as {userProfile?.username}</button>
                </form>
              </div>
              <InfoCard icon={CheckCircle2} title="Posting checklist" text="Use a short title, exact location, department, and one realistic fix. That combination performs best." />
            </div>
          )}

          {activeView === 'alerts' && (
            <div className="space-y-6">
              <div className="soft-card p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Notifications</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Important updates without the stale portal feel.</h2>
                <div className="mt-6 space-y-3">
                  {apiNotifications.map((item) => (
                    <div key={item} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">{item}</div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <InfoCard icon={ShieldAlert} title="Reported Posts" text="14" />
                <InfoCard icon={CircleAlert} title="Fake Content Alerts" text="5" />
                <InfoCard icon={Users} title="Users Under Review" text="3" />
              </div>
            </div>
          )}

          {activeView === 'profile' && (userProfile || profileViewUsername) && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="soft-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  {isOwnProfile && profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="Profile" className="h-24 w-24 rounded-[28px] object-cover" />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-600 to-cyan-500 text-3xl font-bold text-white uppercase">{profileDisplay.username.substring(0,2)}</div>
                  )}
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{profileDisplay.role}</p>
                    <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">{profileDisplay.username}</h2>
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
              </div>
              <InfoCard
                icon={Star}
                title={isOwnProfile ? 'Your Impact' : 'Reporter Activity'}
                text={isOwnProfile
                  ? 'Every verified post builds your reputation. Keep contributing to unlock new civic journalist badges.'
                  : 'This reporter’s public contributions and recent posts are shown here.'}
              />
            </div>
          )}
        </section>

      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold ${
                activeView === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500'
              }`}
            >
              {createElement(item.icon, { className: 'h-4 w-4' })}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function MetricBox({ label, value, dark = true }) {
  return (
    <div className={`${dark ? 'glass-panel text-white' : 'rounded-[24px] border border-slate-200 bg-slate-50 text-slate-900'} px-4 py-4`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${dark ? 'text-white/70' : 'text-slate-400'}`}>{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickRow({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
      {createElement(icon, { className: 'h-4 w-4 text-blue-600' })}
      {text}
    </div>
  );
}

function MetricChip({ icon, value, label, primary = false }) {
  return (
    <div className={`rounded-[22px] border px-4 py-3 ${primary ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center gap-2">
        {createElement(icon, { className: primary ? 'h-4 w-4 text-blue-700' : 'h-4 w-4 text-orange-500' })}
        <span className="text-lg font-bold text-slate-950">{value}</span>
      </div>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
    </div>
  );
}

function InfoCard({ icon, title, text }) {
  return (
    <div className="soft-card p-5">
      <div className="flex items-center gap-2">
        {createElement(icon, { className: 'h-5 w-5 text-blue-600' })}
        <h3 className="font-display text-xl font-bold text-slate-950">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
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

function getVisiblePosts(activeFeed, currentPosts) {
  if (!currentPosts) return [];
  if (activeFeed === 'Verified') return currentPosts.filter((post) => post.verified);
  if (activeFeed === 'Nearby') return currentPosts.filter((post) => post.nearby);
  if (activeFeed === 'Solutions') return [...currentPosts].sort((a, b) => Number(b.solutions) - Number(a.solutions));
  return currentPosts;
}

export default App;


