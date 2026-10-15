// Supabase public configuration. The anon key is safe to embed in client-side
// code — Supabase relies on Row Level Security policies, not key secrecy, to
// protect data. These values are baked into the build at compile time.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://ohjnanqwjgqjmnwlknsh.supabase.co';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oam5hbnF3amdxam1ud2xrbnNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwODk4OTQsImV4cCI6MjEwNzY2NTg5NH0.naSiKd8QKrHWQR4N3KI9SToQwp4-uLx9PNOS8Sg807o';

export { SUPABASE_URL, ANON_KEY };
