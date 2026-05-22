import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const hasConfiguredEnvValue = (value) => {
  const normalizedValue = `${value ?? ''}`.trim();
  if (!normalizedValue) return false;

  const lowerValue = normalizedValue.toLowerCase();
  return !lowerValue.startsWith('your_')
    && !lowerValue.startsWith('your-')
    && !lowerValue.startsWith('replace_')
    && !lowerValue.startsWith('replace-');
};

const supabaseUrl = hasConfiguredEnvValue(process.env.SUPABASE_URL)
  ? `${process.env.SUPABASE_URL}`.trim()
  : '';
const supabaseServiceRoleKey = hasConfiguredEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? `${process.env.SUPABASE_SERVICE_ROLE_KEY}`.trim()
  : '';
const supabaseAnonKey = hasConfiguredEnvValue(process.env.SUPABASE_ANON_KEY)
  ? `${process.env.SUPABASE_ANON_KEY}`.trim()
  : '';
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
} else if (!supabaseServiceRoleKey && supabaseAnonKey) {
  console.warn('Backend is using SUPABASE_ANON_KEY. Prefer SUPABASE_SERVICE_ROLE_KEY for server-side access.');
}

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

export const connectDB = async () => {
  // Supabase doesn't need an explicit 'connect' like MongoDB/Mongoose
  // We can just verify the connection by doing a simple query
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Skipping Supabase connection check because the backend is not configured yet.');
    return;
  }

  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('Supabase Connected successfully');
  } catch (error) {
    console.error(`Supabase Connection Error: ${error.message}`);
    // We don't exit here because the client might still work if the URL/Key are correct but the table doesn't exist yet
  }
};
