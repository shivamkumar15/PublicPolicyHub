import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const connectDB = async () => {
  // Supabase doesn't need an explicit 'connect' like MongoDB/Mongoose
  // We can just verify the connection by doing a simple query
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('Supabase Connected successfully');
  } catch (error) {
    console.error(`Supabase Connection Error: ${error.message}`);
    // We don't exit here because the client might still work if the URL/Key are correct but the table doesn't exist yet
  }
};
