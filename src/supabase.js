import { createClient } from '@supabase/supabase-js';

const hasConfiguredEnvValue = (value) => {
  const normalizedValue = `${value ?? ''}`.trim().toLowerCase();
  return !!normalizedValue
    && !normalizedValue.startsWith('your_')
    && !normalizedValue.startsWith('your-')
    && !normalizedValue.startsWith('replace_')
    && !normalizedValue.startsWith('replace-');
};

const supabaseUrl = hasConfiguredEnvValue(process.env.SUPABASE_URL) ? `${process.env.SUPABASE_URL}`.trim() : '';
const supabaseAnonKey = hasConfiguredEnvValue(process.env.SUPABASE_ANON_KEY) ? `${process.env.SUPABASE_ANON_KEY}`.trim() : '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
