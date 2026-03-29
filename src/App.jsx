import { createElement, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  House,
  Image as ImageIcon,
  Lightbulb,
  MapPin,
  Play,
  Share2,
  SquarePen,
  TrendingUp,
  User,
  Video as VideoIcon,
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
  { id: 'create', label: 'Report', icon: SquarePen, requiresAuth: true },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User, requiresAuth: true },
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
  const [apiPosts, setApiPosts] = useState(defaultPosts);
  const [apiNotifications, setApiNotifications] = useState(defaultNotifications);
  const [isLoading, setIsLoading] = useState(true);

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userProfile, setUserProfile] = useState(null);
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [mediaSlideIndexByPost, setMediaSlideIndexByPost] = useState({});
  const [solutionInputsByPost, setSolutionInputsByPost] = useState({});
  const [isSolutionComposerOpenByPost, setIsSolutionComposerOpenByPost] = useState({});
  const [isActionSubmittingByPost, setIsActionSubmittingByPost] = useState({});
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [profileViewUsername, setProfileViewUsername] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
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

  const openAuthPage = () => {
    setAuthError('');
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

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

  const withPostActionSubmitting = async (postId, actionFn) => {
    setIsActionSubmittingByPost((current) => ({ ...current, [postId]: true }));
    try {
      await actionFn();
    } finally {
      setIsActionSubmittingByPost((current) => ({ ...current, [postId]: false }));
    }
  };

  const handleSupport = async (postId) => {
    try {
      await withPostActionSubmitting(postId, () => updatePostInteraction(postId, 'support', null, true));
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
      setIsSolutionComposerOpenByPost((current) => ({ ...current, [postId]: false }));
    } catch (error) {
      alert(error.message);
    }
  };

  const openAuthorProfile = (username) => {
    if (!username) return;
    setProfileViewUsername(username);
    setActiveView('profile');
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

  const visiblePosts = apiPosts;
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
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center px-4">
          <div className="flex w-full items-center gap-3">
            <button type="button" onClick={() => setActiveView('home')} className="flex items-center gap-2.5">
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
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 pr-3"
                    >
                      {isOwnProfile && profilePhotoUrl ? (
                        <img src={profilePhotoUrl} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white uppercase">
                          {profileDisplay.username.substring(0,2)}
                        </span>
                      )}
                      <span className="hidden text-sm font-semibold sm:block">{profileDisplay.username}</span>
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)]">
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
                          onClick={handleThemeToggle}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Lightbulb className="h-4 w-4" />
                          {theme === 'dark' ? 'Change Theme (Light)' : 'Change Theme (Dark)'}
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

      <main className="mobile-safe mx-auto grid max-w-[1200px] gap-5 px-4 pb-24 pt-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden space-y-4 lg:block">
          <div className="soft-card p-3">
            <p className="px-2 text-xs font-semibold text-slate-500">Navigation</p>
            <div className="mt-3 space-y-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    activeView === item.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {createElement(item.icon, { className: 'h-4 w-4' })}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {activeView === 'home' && (
            <>
              <div className="soft-card p-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Issue Feed</p>
                  <h2 className="mt-1.5 font-display text-[28px] font-bold text-slate-950">Recent civic reports from the community</h2>
                  <p className="mt-2 text-sm text-slate-500">Focus: clear evidence, exact location, and actionable fixes.</p>
                </div>
              </div>

              <div className="space-y-5">
                {visiblePosts.map((post) => {
                  const isSupportedByUser = !!userProfile?.username && post.supporters?.includes(userProfile.username);
                  const solutionInput = solutionInputsByPost[post.id] ?? '';
                  const isSolutionComposerOpen = !!isSolutionComposerOpenByPost[post.id];
                  const isSubmittingAction = !!isActionSubmittingByPost[post.id];

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
                      <div className="video-shell order-1 relative overflow-hidden">
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
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,_transparent_0%,_rgba(2,6,23,0.62)_100%)]" />
                            <div className="absolute left-3 top-3 rounded-md bg-slate-950/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">{post.media}</div>
                            <button className="pulse-ring absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white">
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
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-blue-700"><MapPin className="h-3.5 w-3.5" />{post.location}</span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-slate-600"><Building2 className="h-3.5 w-3.5" />{post.department}</span>
                          {post.verified && <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                        </div>
                        <div>
                          <h3 className="mt-1.5 font-display text-2xl font-bold leading-tight text-slate-950">{post.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{post.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
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
                            onClick={() =>
                              setIsSolutionComposerOpenByPost((current) => ({ ...current, [post.id]: !current[post.id] }))
                            }
                            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isSolutionComposerOpen
                                ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
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
                        </div>
                        {isSolutionComposerOpen && (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleSolutionSubmit(post.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={solutionInput}
                              onChange={(event) => setSolutionInputsByPost((current) => ({ ...current, [post.id]: event.target.value }))}
                              placeholder="Write your solution..."
                              className="form-input h-10"
                              disabled={isSubmittingAction}
                            />
                            <button
                              type="submit"
                              disabled={isSubmittingAction || !solutionInput.trim()}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Lightbulb className="h-4 w-4" />
                              Submit
                            </button>
                          </form>
                        )}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold text-slate-500">Top Fix</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{post.fixes?.[0] || 'Awaiting suggested fixes'}</p>
                        </div>
                      </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
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
            <div className="soft-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                {isOwnProfile && profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Profile" className="h-24 w-24 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 text-3xl font-bold text-white uppercase">{profileDisplay.username.substring(0,2)}</div>
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
            </div>
          )}
        </section>

      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-semibold ${
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

export default App;
