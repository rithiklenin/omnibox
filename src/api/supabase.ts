import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

const supabaseUrlFinal = supabaseUrl || 'http://localhost:54321';

export const supabase = createClient(
  supabaseUrlFinal,
  supabaseAnonKey || 'placeholder'
);

// Get the app URL for OAuth redirects
export function getAppUrl(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:5173';
  }
  
  const { protocol, hostname } = window.location;
  
  // In production on Render, hostname will be something like "omnibox-app.onrender.com"
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    // Production: https://yourrenderapp.onrender.com
    return `${protocol}//${hostname}`;
  }
  
  // Development: use the actual port
  const { port } = window.location;
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}
