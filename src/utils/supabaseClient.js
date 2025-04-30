// Initialize Supabase client
const supabaseUrl = 'https://yxqbajnucttwmcfhuzqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cWJham51Y3R0d21jZmh1enFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjEzOTgsImV4cCI6MjA1OTU5NzM5OH0.44CBRDkAafGaQyM05OpnjjxEoSBq_HAlZFDsghRK7fQ';

const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey); 