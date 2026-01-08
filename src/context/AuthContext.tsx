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
    refreshUser: () => Promise<void>;
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

    // Fetch user profile based on auth session
    const fetchUserProfile = async (sessionUser: any) => {
        setIsLoading(true);
        try {
            // Get profile to check role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionUser.id)
                .single();

            if (profileError) throw profileError;

            let role = profile.role as 'student' | 'donor' | 'admin';

            // Safety Check: If role is 'admin' but a student record exists, prefer 'student'.
            // This fixes accounts that might have been incorrectly flagged as admin during registration.
            if (role === 'admin') {
                const { data: studentCheck } = await supabase
                    .from('students')
                    .select('id')
                    .eq('id', sessionUser.id)
                    .maybeSingle();

                if (studentCheck) {
                    console.warn("User has Admin role but Student profile exists. Treating as Student.");
                    role = 'student';
                    // Optional: Auto-correct DB? 
                    // await supabase.from('profiles').update({ role: 'student' }).eq('id', sessionUser.id);
                }
            }

            const userData: User = {
                id: sessionUser.id,
                email: sessionUser.email,
                role: role,
            };

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
            // Don't set user to null here if we're just checking
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Check for existing session on mount
    useEffect(() => {
        const initializeAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await fetchUserProfile(session.user);
            } else {
                setUser(null);
                setIsLoading(false);
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                    setIsLoading(true);
                    await fetchUserProfile(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setNotifications([]);
                    setIsLoading(false);
                }
            });

            return () => subscription.unsubscribe();
        };

        initializeAuth();
    }, []);

    // Manage Notification Subscription
    useEffect(() => {
        if (!user) return;

        // Fetch existing
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
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
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: { role: role } // This triggers the handle_new_user function
            }
        });

        if (authError || !authData.user) {
            setIsLoading(false);
            return { success: false, error: authError?.message || 'Registration failed' };
        }

        const userId = authData.user.id;

        // FORCE update role in profiles to ensure it matches the requested role
        // This handles cases where the DB trigger might default to 'admin' or fail to read metadata
        const { error: roleChangeError } = await supabase
            .from('profiles')
            .update({ role: role })
            .eq('id', userId);

        if (roleChangeError) {
            console.warn("Could not force-update profile role:", roleChangeError);
            // We continue, as the trigger might have worked anyway. 
            // If it failed critically, the next steps (create_student_profile) might also fail or inconsistent state occurs.
        }

        // 2. Create specific profile record
        let profileError = null;

        if (role === 'student') {
            // Format expected_graduation from "YYYY-MM" to "YYYY-MM-01" (first of month)
            const expectedGradDate = data.expectedGraduation
                ? `${data.expectedGraduation}-01`
                : null;

            // Use RPC function to bypass RLS timing issues after signup
            const { error } = await supabase.rpc('create_student_profile', {
                p_id: userId,
                p_first_name: data.firstName,
                p_last_name: data.lastName,
                p_phone: data.phone,
                p_university_id: data.universityId,
                p_student_number: data.studentNumber,
                p_course: data.course,
                p_year_of_study: data.yearOfStudy,
                p_field_of_study: data.fieldOfStudy,
                p_title: data.title,
                p_expected_graduation: expectedGradDate,
                p_email: data.email  // Ensure profile is created
            });
            profileError = error;
        } else if (role === 'donor') {
            // Use RPC function to bypass RLS timing issues after signup
            const { error } = await supabase.rpc('create_donor_profile', {
                p_id: userId,
                p_first_name: data.firstName,
                p_last_name: data.lastName,
                p_is_anonymous: false,
                p_email: data.email  // Ensure profile is created
            });
            profileError = error;
        }

        if (profileError) {
            // Rollback or handle partial failure? For now just return error
            // Ideally we might want to delete the auth user if this fails to keep clean state
            console.error("Profile creation failed:", profileError);
            setIsLoading(false);
            return { success: false, error: `Account created but profile setup failed: ${profileError.message || JSON.stringify(profileError)}` };
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

    const refreshUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            await fetchUserProfile(session.user);
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
