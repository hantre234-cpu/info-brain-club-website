/* ==========================================
   AUTH SERVICE
   NOTE: Relies on CONFIG and supabaseManager
   already declared in script.js (loaded first)
   ========================================== */

class AuthService {
    static async register(userData) {
        const { fullname, username, email, password, role, roleCustom } = userData;
        
        if (!fullname || !username || !email || !password || !role) {
            throw new Error('All fields are required');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        await supabaseManager.load();
        const supabase = supabaseManager.get();

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullname, username, role, role_custom: roleCustom }
            }
        });

        if (authError) throw authError;

        // Insert into public.users table
        const { error: profileError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                full_name: fullname,
                username: username,
                email: email,
                role: role,
                role_custom: roleCustom || null,
                is_guest: false,
                department: null,
                bio: null,
                avatar_url: null,
                is_admin: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Profile creation failed:', profileError);
        }

        return authData;
    }

    static async login(identifier, password) {
        const id = typeof identifier === 'string' ? identifier.trim() : '';
        if (!id || !password) {
            throw new Error('Please fill in all fields');
        }

        await supabaseManager.load();
        const supabase = supabaseManager.get();

        let email = id;
        
        // If identifier doesn't contain @, treat it as username and fetch email
        if (!id.includes('@')) {
            const { data: userRecord, error } = await supabase
                .from('users')
                .select('email')
                .eq('username', id)
                .single();
            
            if (error || !userRecord) {
                throw new Error('No account found with that username');
            }
            email = userRecord.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        let profile = null;
        try {
            const { data: profileData } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            profile = profileData || null;
        } catch {
            profile = null;
        }

        const fullName = profile?.full_name || data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User';

        const currentUserPayload = profile ? {
            ...profile,
            id: profile.id || data.user.id,
            email: profile.email || data.user.email,
            full_name: fullName
        } : {
            id: data.user.id,
            email: data.user.email,
            full_name: fullName
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUserPayload));

        return data;
    }

    static async requestPasswordReset(email) {
        if (!email) throw new Error('please enter your email');
        
        await supabaseManager.load();
        const supabase = supabaseManager.get();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });

        if (error) throw error;
        return true;
    }

    static async updatePassword(newPassword) {
        if (!newPassword || newPassword.length < CONFIG.MIN_PASSWORD_LENGTH) {
            throw new Error(`password must be at least ${CONFIG.MIN_PASSWORD_LENGTH} characters`);
        }

        await supabaseManager.load();
        const supabase = supabaseManager.get();

        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
            throw new Error('Session expired. Please request a new reset link.');
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;

        await supabase.auth.signOut();
        return true;
    }

    static continueAsGuest() {
        localStorage.setItem('currentUser', JSON.stringify({ 
            guest: true, 
            full_name: 'Guest' 
        }));
    }

    static signOutGuest() {
        localStorage.removeItem('currentUser');
    }

    static getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('currentUser') || '{}');
        } catch {
            return {};
        }
    }
}