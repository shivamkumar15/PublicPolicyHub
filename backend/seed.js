import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });



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

const realPosts = [
  {
    id: 'post-delhi-bawana-smoke',
    author: 'CleanAirDelhi',
    title: 'Bawana industrial zone releasing thick smoke after midnight',
    description: 'Factories near the Bawana industrial area have been burning waste after midnight for the past two weeks. Residents wake up to a thick haze and a strong chemical smell. Please inspect and enforce emission norms.',
    location: 'Bawana, Delhi',
    department: 'DPCC (Delhi Pollution Control Committee)',
    media: 'IMAGE',
    tag: 'Environment',
    accent: '#0f766e',
    support: '2.4k',
    comments: '180',
    solutions: '45',
    time: '6',
    fixes: ['Install real-time stack emission monitors', 'Conduct surprise night inspections', 'Publish inspection reports online'],
    mediaList: [],
  },
  {
    id: 'post-pune-hinjewadi-traffic',
    author: 'PuneCommuter',
    title: 'Hinjewadi Phase 2 junction choked every evening due to metro construction',
    description: 'The Hinjewadi Phase 2 signal junction is gridlocked from 6 PM to 9 PM because metro pillars narrow the road to a single lane. Auto and bus commuters are stuck for 40+ minutes daily.',
    location: 'Hinjewadi, Pune',
    department: 'Pune Metro & Traffic Police',
    media: 'IMAGE',
    tag: 'Infrastructure',
    accent: '#b45309',
    support: '1.8k',
    comments: '96',
    solutions: '31',
    time: '14',
    fixes: ['Deploy traffic marshals at peak hours', 'Create a temporary alternate route signage plan', 'Stagger metro construction vehicle movement'],
    mediaList: [],
  },
  {
    id: 'post-chennai-water-taste',
    author: 'ChennaiWaterWatch',
    title: 'Turbid, salty tap water across Velachery for over a week',
    description: 'Residents of Velachery have received muddy, salty water since the reservoir inflow changed. Water purifier filters clog within days and several families report stomach upsets. CMWSSB has been informed but no resolution yet.',
    location: 'Velachery, Chennai',
    department: 'CMWSSB (Chennai Water)',
    media: 'IMAGE',
    tag: 'Water',
    accent: '#2563eb',
    support: '920',
    comments: '64',
    solutions: '18',
    time: '9',
    fixes: ['Flush and clean the affected feeder lines', 'Test water quality daily and publish results', 'Provide tanker supply until resolved'],
    mediaList: [],
  },
  {
    id: 'post-mumbai-weh-crater',
    author: 'MumbaiRoads',
    title: 'Massive crater on Western Express Highway near Kalanagar',
    description: 'A deep crater has opened up on the WEH service road near Kalanagar after the rains. Two-wheelers have already swerved dangerously to avoid it. Needs an immediate barricade and urgent repair.',
    location: 'Kalanagar, Mumbai',
    department: 'BMC (Brihanmumbai Municipal Corporation)',
    media: 'IMAGE',
    tag: 'Road Safety',
    accent: '#dc2626',
    support: '3.1k',
    comments: '210',
    solutions: '27',
    time: '2',
    fixes: ['Barricade the crater today', 'Issue a repair tender with a 7-day deadline', 'Audit the stretch for more weak spots'],
    mediaList: [],
  },
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
  if (!supabase) {
    console.error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env first (see backend/.env.example or README).');
    return;
  }

  try {
    console.log('Clearing old data...');

    await supabase.from('posts').delete().neq('id', '');
    await supabase.from('cities').delete().neq('city', '');
    await supabase.from('notifications').delete().neq('message', '');
    await supabase.from('users').delete().neq('username', '');

    console.log('Inserting real-world Users...');
    const users = [...new Set(realPosts.map(p => p.author))];
    for (const username of users) {
      await supabase.from('users').upsert({ username, role: 'User' }, { onConflict: 'username' });
    }

    console.log('Inserting real-world Posts...');
    for (const post of realPosts) {
      const normalizedPost = {
        id: post.id,
        author: post.author,
        title: post.title,
        description: post.description,
        location: post.location,
        department: post.department,
        media: post.media,
        tag: post.tag,
        accent: post.accent,
        support: toCount(post.support),
        comments: toCount(post.comments),
        solutions: toCount(post.solutions),
        created_at: new Date(Date.now() - (parseInt(post.time) || 1) * 3600000), // Approximate date
        fixes: post.fixes || [],
        media_list: post.mediaList || []
      };
      const { error } = await supabase.from('posts').upsert(normalizedPost, { onConflict: 'id' });
      if (error) {
        console.error(`Error inserting post ${post.id}:`, error.message);
      }
    }

    console.log('Inserting real-world Cities...');
    for (const city of realCities) {
      await supabase.from('cities').upsert(city, { onConflict: 'city' });
    }

    console.log('Inserting real-world Notifications...');
    for (const message of realNotifications) {
      await supabase.from('notifications').insert({
        message,
        recipient_username: 'CleanAirDelhi', // Assign to one of the seeded users
      });
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
