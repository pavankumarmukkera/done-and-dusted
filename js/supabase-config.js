// Supabase Configuration
const SUPABASE_URL = 'https://mhjgnigscvzgvxnbcgrb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oamduaWdzY3Z6Z3Z4bmJjZ3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTEwMDEsImV4cCI6MjA4MDQyNzAwMX0.BLO-ak6U7tj8mWdf6CbYHANxCFgZUA4IbJu93h6EFII';

// Initialize Supabase client
let supabase;
try {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error('Supabase library not loaded');
    }
} catch (error) {
    console.error('Error initializing Supabase:', error);
}
