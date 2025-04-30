// Initialize Supabase client
const supabaseUrl = 'https://yxqbajnucttwmcfhuzqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cWJham51Y3R0d21jZmh1enFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwMjEzOTgsImV4cCI6MjA1OTU5NzM5OH0.44CBRDkAafGaQyM05OpnjjxEoSBq_HAlZFDsghRK7fQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);

// Check if user is authenticated
async function checkAuth() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error checking session:', error.message);
        return null;
    }
    return session;
}

// Get user profile
async function getUserProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error.message);
        return null;
    }
    return profile;
}

// Sign up new user
async function signUp(email, password, name, role) {
    try {
        // Sign up with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // Create profile in profiles table
        const { error: profileError } = await supabase
            .from('profiles')
            .insert([
                {
                    id: authData.user.id,
                    name,
                    role,
                },
            ]);

        if (profileError) throw profileError;

        return { success: true, user: authData.user };
    } catch (error) {
        console.error('Error signing up:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign in user
async function signIn(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return { success: true, user: data.user };
    } catch (error) {
        console.error('Error signing in:', error.message);
        return { success: false, error: error.message };
    }
}

// Sign out user
async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error signing out:', error.message);
        return { success: false, error: error.message };
    }
}

// Redirect based on user role
async function redirectBasedOnRole() {
    const profile = await getUserProfile();
    if (!profile) {
        window.location.href = '/login.html';
        return;
    }

    if (profile.role === 'admin') {
        window.location.href = '/admin/dashboard.html';
    } else {
        window.location.href = '/employee/dashboard.html';
    }
} 