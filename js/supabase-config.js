// Supabase Configuration
const SUPABASE_URL = 'https://mhjgnigscvzgvxnbcgrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oamduaWdzY3Z6Z3Z4bmJjZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTEwMDEsImV4cCI6MjA4MDQyNzAwMX0.BLO-ak6U7tj8mWdf6CbYHANxCFgZUA4IbJu93h6EFII';

// Initialize Supabase client
// We check for both 'supabase' and 'supabase_js' as the library might be loaded as either.
// We then set window.supabase to the created client instance.
(function () {
    let client;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
        client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else if (typeof supabase_js !== 'undefined' && supabase_js.createClient) {
        client = supabase_js.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    if (client) {
        window.supabase = client;
    } else {
        console.error('Supabase library not found. Please ensure the CDN script is loaded correctly.');
    }
})();
