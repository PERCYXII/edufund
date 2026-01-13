import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Student, Donor, Notification } from '../types';

// ============================================
// Auth Context Types
// ============================================
interface AuthContextType {
    user: User | null;
    notifications: Notification[];
    isLoading: boolean;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
    loginAsStudent: (studentData: Student) => void;
    loginAsDonor: (donorData: Donor) => void;
    loginAsAdmin: () => void;
    logout: () => void;
    register: (role: 'student' | 'donor', data: any) => Promise<{ success: boolean; error?: string; data?: any }>;
    resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    markNotificationAsRead: (id: string) => void;
    refreshUser: (silent?: boolean) => Promise<void>;
}

// ============================================
// Create Context
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Auth Provider Component
// ============================================
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isFetchingRef = React.useRef(false);

    // Fetch user profile based on auth session
    const fetchUserProfile = async (sessionUser: any, silent: boolean = false) => {
        // Prevent duplicate fetches
        if (isFetchingRef.current) {
            return null;
        }
        isFetchingRef.current = true;
        if (!silent) setIsLoading(true);
        try {
            // Get profile to check role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .maybeSingle();

            if (profileError) {
                console.error("Error fetching profile from DB:", profileError);
                // We typically continue to try metadata
            }

            let role = profile?.role as 'student' | 'donor' | 'admin';

            // Fallback: If profile doesn't exist or has no role, check Auth Metadata
            if (!role && sessionUser.user_metadata?.role) {
                console.log("Profile missing/empty, using metadata role:", sessionUser.user_metadata.role);
                role = sessionUser.user_metadata.role;
            }

            // Safety Check: If role is 'admin' but a student record exists, prefer 'student'.
            if (role === 'admin') {
                const { data: studentCheck } = await supabase
                    .from('students')
                    .select('id')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (studentCheck) {
                    console.warn("User has Admin role but Student profile exists. Treating as Student.");
                    role = 'student';
                }
            }

            const userData: User = {
                id: sessionUser.id,
                email: sessionUser.email,
                role: role,
            };

            // Fetch extended data based on role
            if (role === 'student') {
                const { data: student } = await supabase
                    .from('students')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (student) {
                    userData.student = {
                        id: student.id,
                        email: sessionUser.email,
                        firstName: student.first_name,
                        lastName: student.last_name,
                        phone: student.phone,
                        universityId: student.university_id,
                        studentNumber: student.student_number,
                        course: student.course,
                        yearOfStudy: student.year_of_study,
                        expectedGraduation: student.expected_graduation,
                        verificationStatus: student.verification_status,
                        profileImage: student.profile_image_url,
                        createdAt: student.created_at,
                        updatedAt: student.updated_at
                    };
                } else {
                    // If student record missing, we might want to scaffold a basic one or just leave it empty
                    // so the UI knows they need to complete profile.
                    // For now, leave 'userData.student' undefined.
                }
            } else if (role === 'donor') {
                const { data: donor } = await supabase
                    .from('donors')
                    .select('*')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (donor) {
                    userData.donor = {
                        id: donor.id,
                        email: sessionUser.email,
                        firstName: donor.first_name,
                        lastName: donor.last_name,
                        phone: donor.phone,
                        profileImage: donor.profile_image_url,
                        isAnonymous: donor.is_anonymous,
                        totalDonated: 0,
                        createdAt: donor.created_at
                    };
                }
            }

            console.log('User profile fetched successfully:', userData);
            setUser(userData);
            return userData;

        } catch (error) {
            console.error("Error fetching user profile:", error);
            // Even if DB fetching fails entirely, return a partial user from session if possible
            if (sessionUser) {
                const fallbackUser: User = {
                    id: sessionUser.id,
                    email: sessionUser.email,
                    role: sessionUser.user_metadata?.role as any
                };
                setUser(fallbackUser);
                return fallbackUser;
            }
            return null;
        } finally {
            isFetchingRef.current = false;
            if (!silent) setIsLoading(false);
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        let lastVisibilityFetch = 0;

        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserProfile(session.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') && session?.user) {
                    setIsLoading(true);
                    await fetchUserProfile(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setNotifications([]);
                    setIsLoading(false);
                }
            });

            // Handle tab visibility changes - re-sync auth when user returns
            // Debounced to prevent excessive re-fetching
            const handleVisibilityChange = async () => {
                if (document.visibilityState === 'visible') {
                    const now = Date.now();
                    // Only re-fetch if more than 30 seconds have passed since last fetch
                    if (now - lastVisibilityFetch < 30000) {
                        return;
                    }
                    lastVisibilityFetch = now;

                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                        // Don't set loading state to avoid UI flicker
                        await fetchUserProfile(session.user);
                    }
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            return () => {
                subscription.unsubscribe();
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        };

        initializeAuth();
    }, []);

    // Manage Notification Subscription
    useEffect(() => {
        if (!user) return;

        // Fetch existing (with 3-day retention)
        const fetchNotifications = async () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

            // 1. Cleanup old notifications
            await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id)
                .lt('created_at', threeDaysAgo);

            // 2. Fetch recent
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', threeDaysAgo)
                .order('created_at', { ascending: false });

            if (data) {
                setNotifications(data as any);
            }
        };
        fetchNotifications();

        // Subscribe to real-time
        const channel = supabase
            .channel('notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    setNotifications((prev) => [payload.new as Notification, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> => {
        setIsLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setIsLoading(false);
            return { success: false, error: error.message };
        }

        if (data.session?.user) {
            const userProfile = await fetchUserProfile(data.session.user);
            return { success: true, user: userProfile || undefined };
        }

        return { success: true };
    };

    const loginAsStudent = (_studentData: Student) => {
        // Legacy/Dev helper - probably warn or remove
        console.warn("loginAsStudent is deprecated in favor of real auth");
    };

    const loginAsDonor = (_donorData: Donor) => {
        console.warn("loginAsDonor is deprecated in favor of real auth");
    };

    const loginAsAdmin = () => {
        console.warn("loginAsAdmin is deprecated in favor of real auth");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const register = async (role: 'student' | 'donor', data: any): Promise<{ success: boolean; error?: string; data?: any }> => {
        setIsLoading(true);

        // 1. Sign up with Supabase Auth
        // We pass the role in metadata so the handle_new_user trigger works.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { role: role }
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
                console.warn("User already registered. checking session...");
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData.session?.user) {
                    // User is already logged in, proceed
                    authData.user = sessionData.session.user as any;
                } else {
                    setIsLoading(false);
                    return { success: false, error: "User already exists. Please login to continue." };
                }
            } else {
                setIsLoading(false);
                return { success: false, error: authError.message || 'Registration failed' };
            }
        }

        if (!authData.user) {
            setIsLoading(false);
            return { success: false, error: 'Registration failed - No user data returned' };
        }

        const userId = authData.user.id;

        // 2. Ensure Profile Exists (Manual Fallback for Trigger)
        // We explicitly insert/ignore to ensure the 'profiles' row exists immediately.
        // This solves the issue where the trigger might fail or be slow.
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: data.email,
                role: role
            }, { onConflict: 'id' });

        if (profileError) {
            console.warn("Manual profile creation warning (trigger might have handled it):", profileError);
        }

        // 3. Role-specific logic
        // For Students: We DO NOT create the 'students' record here anymore.
        // The 'handle_new_user' trigger creates the base 'profiles' record.
        // The user will complete their details in the /complete-profile page.

        // For Donors: We keep the existing logic for now as there isn't a separate flow yet.
        if (role === 'donor') {
            const { error } = await supabase.rpc('create_donor_profile', {
                p_id: userId,
                p_first_name: data.firstName,
                p_last_name: data.lastName,
                p_is_anonymous: false,
                p_email: data.email
            });

            if (error) {
                console.error("Donor profile creation failed:", error);
                // We don't block auth success, but warn
            }
        }

        setIsLoading(false);
        return { success: true, data: authData };
    };

    const resetPasswordForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const markNotificationAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);
    };

    const refreshUser = async (silent: boolean = false) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchUserProfile(session.user, silent);
        }
    };

    const value: AuthContextType = {
        user,
        notifications,
        isLoading,
        isLoggedIn: !!user,
        login,
        loginAsStudent,
        loginAsDonor,
        loginAsAdmin,
        logout,
        register,
        resetPasswordForEmail,
        updatePassword,
        markNotificationAsRead,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================
// Custom Hook
// ============================================
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
