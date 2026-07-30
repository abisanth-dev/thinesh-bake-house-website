import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase client env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not set.');
}

// Browser client — only used for Supabase Auth (admin login/session) and reading
// the logged-in admin's own profile row. All other data reads/writes go through
// the Express API, which uses the service-role key server-side.
export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
