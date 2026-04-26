import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[PSC] Supabase env vars missing — vault data will not load');
}

export const supabase = createClient(url, key);
