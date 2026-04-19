import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Post from './models/Post.js';
import City from './models/City.js';
import Notification from './models/Notification.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const realPosts = [
  {
    id: 'delhi_aqi',
    location: 'Delhi, NCR',
    department: 'Environment & Forestry',
    title: 'Illegal industrial waste burning in Bawana despite ban',
    description: 'Multiple factory units in Sector 3 Bawana Industrial Area are burning plastic/chemical waste at night. Local AQI monitors spiked to 450+ at 2 AM. Attached video shows black smoke rising near residential pockets. Authorities have not responded to repeated complaints.',
    author: 'CleanAirDelhi',
    time: '2h ago',
    support: '5.2k',
    comments: '840',
    solutions: '120',
    media: 'VIDEO',
    verified: true,
    nearby: false,
    tag: 'Pollution',
    accent: 'from-slate-900 via-gray-700 to-red-900',
    fixes: ['Deploy night patrol squads.', 'Mandatory CCTV for factory chimneys.', 'Heavy fines for landowners.']
  },
  {
    id: 'mumbai_pothole',
    location: 'Andheri East, Mumbai',
    department: 'BMC Roads',
    title: 'Massive crater on WEH causing daily accidents',
    description: 'A 4-foot wide pothole has developed on the Western Express Highway near the Andheri flyover. Two bikers fell yesterday during the evening rains. The patch was supposedly "repaired" just last month before monsoon. Contractor details attached.',
    author: 'MumbaiWatchdog',
    time: '4h ago',
    support: '8.9k',
    comments: '1205',
    solutions: '34',
    media: 'IMAGE',
    verified: true,
    nearby: false,
    tag: 'Infrastructure',
    accent: 'from-blue-950 via-slate-800 to-amber-600',
    fixes: ['Blacklist the current road contractor.', 'Use cold-mix asphalt for immediate patching.', 'Audit BMC repair logs.']
  },
  {
    id: 'chennai_water',
    location: 'Velachery, Chennai',
    department: 'Water Supply (CMWSSB)',
    title: 'Contaminated yellow water from municipal pipes for 3 days',
    description: 'Over 200 households in Velachery Phase 2 are receiving yellow, foul-smelling water. We suspect a sewage line has mixed with the drinking water supply pipeline near the main junction. Multiple residents reporting stomach illness.',
    author: 'VelacheryVoice',
    time: '12h ago',
    support: '3.1k',
    comments: '412',
    solutions: '18',
    media: 'IMAGE',
    verified: true,
    nearby: false,
    tag: 'Public Health',
    accent: 'from-cyan-950 via-teal-800 to-yellow-600',
    fixes: ['Dispatch emergency water tankers immediately.', 'Isolate the cross-contamination pipe section.', 'Provide free medical camps in the area.']
  },
  {
    id: 'pune_traffic',
    location: 'Hinjewadi IT Park, Pune',
    department: 'Traffic Planning',
    title: '2-hour gridlock daily due to unscientific barricading',
    description: 'Recent metro construction barricades at Shivaji Chowk have choked a 4-lane road into a single lane without any alternate routing. Ambulances are getting stuck daily. Commuters lose 2+ hours just exiting the IT park.',
    author: 'TechieCivic',
    time: '1d ago',
    support: '12.4k',
    comments: '2100',
    solutions: '89',
    media: 'VIDEO',
    verified: true,
    nearby: false,
    tag: 'Traffic',
    accent: 'from-indigo-950 via-purple-800 to-rose-500',
    fixes: ['Open the adjacent service road temporarily.', 'Deploy traffic wardens at the choke point.', 'Implement staggered IT park exit timings.']
  },
  {
    id: 'hyd_electricity',
    location: 'Kukatpally, Hyderabad',
    department: 'Electricity Board',
    title: 'Unannounced 6-hour power cuts ruining small businesses',
    description: 'For the last 10 days, there have been massive unannounced power cuts from 10 AM to 4 PM. Small shops and home-based businesses are suffering huge losses. Customer care lines are continuously busy or unhelpful.',
    author: 'HydCitizen',
    time: '5h ago',
    support: '4.6k',
    comments: '530',
    solutions: '22',
    media: 'IMAGE',
    verified: false,
    nearby: false,
    tag: 'Power',
    accent: 'from-stone-900 via-yellow-700 to-orange-500',
    fixes: ['Publish power-cut schedules online 24h prior.', 'Upgrade the local transformer capacity.', 'Set up a dedicated grievance desk.']
  },
  {
    id: 'bengaluru_lake',
    location: 'Bellandur, Bengaluru',
    department: 'Lake Development Authority',
    title: 'Fresh chemical frothing observed at Bellandur Lake',
    description: 'After the recent spell of rain, toxic white froth is flying onto the streets again near the Yamalur bridge. The STPs (Sewage Treatment Plants) upstream seem to be bypassing untreated industrial effluents directly into the lake network.',
    author: 'SaveBLRLakes',
    time: '8h ago',
    support: '15.2k',
    comments: '3400',
    solutions: '210',
    media: 'VIDEO',
    verified: true,
    nearby: false,
    tag: 'Environment',
    accent: 'from-emerald-950 via-green-700 to-lime-400',
    fixes: ['Strict audits of upstream apartment STPs.', 'Seal factories releasing untreated dye.', 'Increase functioning capacity of main city STP.']
  }
];

const realCities = [
  { city: 'Delhi', issues: 450, topic: 'Air Pollution & Waste' },
  { city: 'Mumbai', issues: 380, topic: 'Potholes & Infra' },
  { city: 'Bengaluru', issues: 520, topic: 'Traffic & Lakes' },
  { city: 'Chennai', issues: 210, topic: 'Water Quality' },
  { city: 'Pune', issues: 195, topic: 'Metro Construction Traffic' },
  { city: 'Hyderabad', issues: 150, topic: 'Power Cuts' }
];

const realNotifications = [
  'New comment on your Bawana pollution report',
  'Your solution for Hinjewadi Traffic reached target support',
  'Issue verified by CMWSSB authorities (Chennai Water)',
  'Trending alert: Massive crater on WEH (Mumbai)'
];

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

export async function seed() {
  try {
    // We already have a connection if called from db.js, but let's check
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    console.log('Clearing old data...');
    
    await Post.deleteMany({});
    await City.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});

    console.log('Inserting real-world Users...');
    const users = [...new Set(realPosts.map(p => p.author))];
    for (const username of users) {
      await User.updateOne({ username }, { username, role: 'User' }, { upsert: true });
    }
    
    console.log('Inserting real-world Posts...');
    for (const post of realPosts) {
      const normalizedPost = {
        ...post,
        support: toCount(post.support),
        comments: toCount(post.comments),
        solutions: toCount(post.solutions),
      };
      await Post.updateOne({ id: post.id }, normalizedPost, { upsert: true });
    }

    console.log('Inserting real-world Cities...');
    for (const city of realCities) {
      await City.updateOne({ city: city.city }, city, { upsert: true });
    }

    console.log('Inserting real-world Notifications...');
    for (const message of realNotifications) {
      await Notification.create({ message });
    }

    console.log('Real data seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
    throw err;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
