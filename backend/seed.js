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
