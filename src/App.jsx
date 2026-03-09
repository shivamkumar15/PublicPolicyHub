import { createElement, useState } from 'react';
import {
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Filter,
  Flame,
  House,
  Image,
  LayoutGrid,
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
  Video,
  Vote,
} from 'lucide-react';

const Logo = new URL('../Logo.svg', import.meta.url).href;

const navItems = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'map', label: 'Map', icon: MapPinned },
  { id: 'create', label: 'Post', icon: SquarePen },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
];

const feedTabs = ['Trending', 'Verified', 'Nearby', 'Solutions'];

const storyReels = [
  { city: 'Patna', topic: 'Checkpoint sting', tone: 'from-orange-400 to-rose-500' },
  { city: 'Delhi', topic: 'Metro thread', tone: 'from-blue-500 to-cyan-500' },
  { city: 'Mumbai', topic: 'Flood watch', tone: 'from-indigo-500 to-violet-500' },
  { city: 'Lucknow', topic: 'School audit', tone: 'from-emerald-500 to-lime-400' },
];

const posts = [
  {
    id: 'patna',
    location: 'Patna, Bihar',
    department: 'Traffic Police',
    title: 'Police asking bribe at checkpoint',
    description: 'Driver forced to pay Rs 500 to pass. Timestamped clip, route details, and prior complaint references are attached.',
    author: 'CitizenReporter',
    time: '3h ago',
    support: '2.4k',
    comments: '342',
    solutions: '45',
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
    support: '1.9k',
    comments: '228',
    solutions: '31',
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
    support: '1.2k',
    comments: '174',
    solutions: '20',
    media: 'IMAGE',
    verified: false,
    nearby: true,
    tag: 'Education',
    accent: 'from-emerald-700 via-emerald-500 to-lime-300',
    fixes: ['District inventory portal.', 'Photo proof before payment.', 'Parent grievance hotline.'],
  },
];

const cities = [
  { city: 'Delhi', issues: 120, topic: 'Ticketing scams' },
  { city: 'Mumbai', issues: 95, topic: 'Drainage and roads' },
  { city: 'Patna', issues: 40, topic: 'Traffic corruption' },
  { city: 'Bengaluru', issues: 67, topic: 'Bus gaps' },
];

const notifications = [
  'New comment on your Patna checkpoint post',
  'Your solution reached 50 upvotes',
  'Issue verified by community moderators',
];

function App() {
  const [activeView, setActiveView] = useState('home');
  const [activeFeed, setActiveFeed] = useState('Trending');
  const [selectedId, setSelectedId] = useState(posts[0].id);

  const visiblePosts = getVisiblePosts(activeFeed);
  const selectedPost = posts.find((post) => post.id === selectedId) ?? visiblePosts[0];

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
              <button onClick={() => setActiveView('create')} className="hidden rounded-full bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 sm:inline-flex">
                Upload
              </button>
              <button onClick={() => setActiveView('alerts')} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600">
                <Bell className="h-4 w-4" />
                <span className="notification-dot" />
              </button>
              <button onClick={() => setActiveView('profile')} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 pr-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-xs font-bold text-white">SK</span>
                <span className="hidden text-sm font-semibold sm:block">Shivam</span>
              </button>
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

      <main className="mobile-safe mx-auto grid max-w-[1550px] gap-6 px-4 pb-24 pt-4 lg:grid-cols-[250px_minmax(0,1fr)_360px]">
        <aside className="hidden space-y-4 lg:block">
          <div className="soft-card p-4">
            <p className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Navigation</p>
            <div className="mt-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
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
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Hot Reels</p>
                    <h2 className="mt-2 font-display text-2xl font-bold text-slate-950">Issue stories people are replaying</h2>
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
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                      <Filter className="h-4 w-4" />
                      Filter
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                      <LayoutGrid className="h-4 w-4" />
                      Layout
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {storyReels.map((story) => (
                    <button
                      key={story.city}
                      className="group rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:-translate-y-1 hover:border-slate-300 hover:bg-white"
                    >
                      <div className={`mb-4 h-14 w-14 rounded-full bg-gradient-to-br ${story.tone} p-[2px] shadow-lg shadow-slate-200`}>
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-display text-sm font-bold text-slate-950">
                          {story.city.slice(0, 2)}
                        </div>
                      </div>
                      <p className="font-display text-lg font-bold text-slate-950">{story.city}</p>
                      <p className="mt-1 text-sm text-slate-500">{story.topic}</p>
                    </button>
                  ))}
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
                    className={`soft-card group cursor-pointer overflow-hidden p-4 transition hover:-translate-y-1 hover:shadow-[0_34px_90px_-38px_rgba(37,99,235,0.3)] sm:p-5 animate-rise [animation-fill-mode:backwards] ${
                      selectedId === post.id ? 'ring-2 ring-blue-200' : ''
                    }`}
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
                      <div className="video-shell order-1 group-hover:scale-[1.015]">
                        <div className={`absolute inset-0 bg-gradient-to-br ${post.accent}`} />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.28),_transparent_26%),linear-gradient(180deg,_transparent_0%,_rgba(15,23,42,0.68)_100%)]" />
                        <div className="absolute left-4 top-4 rounded-full bg-slate-950/45 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">{post.media}</div>
                        <button className="pulse-ring absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur">
                          <Play className="ml-1 h-7 w-7 fill-current" />
                        </button>
                        <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/15 bg-white/10 p-4 text-white backdrop-blur-xl">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">{post.tag}</p>
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                            <span className="rounded-full bg-white/10 px-2 py-2">{post.support}</span>
                            <span className="rounded-full bg-white/10 px-2 py-2">{post.comments}</span>
                            <span className="rounded-full bg-white/10 px-2 py-2">{post.solutions}</span>
                          </div>
                        </div>
                      </div>

                      <div className="order-2 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700"><MapPin className="h-3.5 w-3.5" />{post.location}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600"><Building2 className="h-3.5 w-3.5" />{post.department}</span>
                          {post.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />Verified</span>}
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Posted by {post.author} • {post.time}</p>
                          <h3 className="mt-2 font-display text-2xl font-bold leading-tight text-slate-950 sm:text-[2rem]">{post.title}</h3>
                          <p className="mt-3 text-[15px] leading-7 text-slate-600">{post.description}</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <MetricChip icon={TrendingUp} value={post.support} label="Support" primary />
                          <MetricChip icon={MessageSquare} value={post.comments} label="Comments" />
                          <MetricChip icon={Lightbulb} value={post.solutions} label="Solutions" />
                        </div>
                        <div className="rounded-[24px] bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Top Fix</p>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{post.fixes[0]}</p>
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
                      {cities.map((city) => (
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
                <form className="mt-6 space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button className="rounded-[24px] border border-blue-200 bg-blue-50 p-4 text-left"><Video className="h-5 w-5 text-blue-700" /><p className="mt-3 font-semibold text-slate-950">Video</p></button>
                    <button className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left"><Image className="h-5 w-5 text-orange-500" /><p className="mt-3 font-semibold text-slate-950">Image</p></button>
                  </div>
                  <input type="text" placeholder="Title" className="form-input" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input type="text" placeholder="Location" className="form-input" />
                    <select className="form-input"><option>Police</option><option>Municipality</option><option>Education</option><option>Transport</option></select>
                  </div>
                  <textarea rows="5" placeholder="Description" className="form-input min-h-[140px] resize-none" />
                  <textarea rows="3" placeholder="Suggested solution (optional)" className="form-input min-h-[110px] resize-none" />
                  <button className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">Post Issue</button>
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
                  {notifications.map((item) => (
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

          {activeView === 'profile' && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="soft-card p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-600 to-orange-500 text-3xl font-bold text-white">SK</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Citizen Reporter</p>
                    <h2 className="mt-2 font-display text-3xl font-bold text-slate-950">Shivam Kumar</h2>
                    <p className="mt-2 text-sm text-slate-500">Posts: 12 • Solutions Proposed: 8</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MetricBox label="Reputation" value="540" dark={false} />
                      <MetricBox label="Badges" value="3" dark={false} />
                      <MetricBox label="Streak" value="7d" dark={false} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['Public Watchdog', 'Active Reporter', 'Solution Builder'].map((badge) => (
                        <span key={badge} className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">{badge}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <InfoCard icon={Star} title="Profile Goal" text="Make contributors feel closer to creators and civic journalists than forum accounts." />
            </div>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="soft-card overflow-hidden p-0">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Post Page UI</p>
              <h2 className="mt-3 font-display text-2xl font-bold">{selectedPost.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selectedPost.description}</p>
            </div>
            <div className="p-5">
            <div className="mt-5 grid gap-3">
              <DetailRow icon={MapPin} label="Location" value={selectedPost.location} />
              <DetailRow icon={Building2} label="Department" value={selectedPost.department} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button className="rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20">Support</button>
              <button className="rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Disagree</button>
            </div>
            <div className="mt-6 space-y-3">
              {selectedPost.fixes.map((fix, index) => (
                <div key={fix} className="rounded-[22px] bg-slate-50 p-4 text-sm font-semibold text-slate-900">{index + 1}. {fix}</div>
              ))}
            </div>
            </div>
          </div>

          <div className="soft-card p-5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <h3 className="font-display text-xl font-bold text-slate-950">Trending Issues</h3>
            </div>
            <div className="mt-4 space-y-3">
              {['Fuel Pricing Transparency', 'Police Corruption', 'Exam Paper Leaks', 'Road Infrastructure'].map((item) => (
                <div key={item} className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{item}</div>
              ))}
            </div>
          </div>

          <div className="soft-card p-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h3 className="font-display text-xl font-bold text-slate-950">Top Contributors</h3>
            </div>
            <div className="mt-4 space-y-3">
              {['Shivam Kumar', 'Aditi Singh', 'MetroLens'].map((person) => (
                <div key={person} className="rounded-[22px] border border-slate-200 p-4 text-sm font-semibold text-slate-800">{person}</div>
              ))}
            </div>
          </div>
        </aside>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
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

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-slate-50 px-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
        {createElement(icon, { className: 'h-4 w-4' })}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function getVisiblePosts(activeFeed) {
  if (activeFeed === 'Verified') return posts.filter((post) => post.verified);
  if (activeFeed === 'Nearby') return posts.filter((post) => post.nearby);
  if (activeFeed === 'Solutions') return [...posts].sort((a, b) => Number(b.solutions) - Number(a.solutions));
  return posts;
}

export default App;
