// This file helps verify that environment variables are loaded correctly
console.log('Environment Variables Test:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '***' : 'NOT SET',
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '***' : 'NOT SET',
  NODE_ENV: import.meta.env.MODE
});

export {};
