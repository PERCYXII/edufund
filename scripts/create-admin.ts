// Script to create admin user
// Run this once: npx ts-node scripts/create-admin.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nsgucgicmfrudzedynuj.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zZ3VjZ2ljbWZydWR6ZWR5bnVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjQ0MDUsImV4cCI6MjA4MzM0MDQwNX0.rimJyQRa7xnIVgxSVc5CR3hevzTfWwI0UW-Hy_w1hMM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
    const adminEmail = 'admin@edufund.co.za';
    const adminPassword = 'Admin@2024!'; // Change this!

    console.log('Creating admin user...');

    // Sign up the admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
            data: {
                role: 'admin'
            }
        }
    });

    if (authError) {
        console.error('Error creating admin:', authError);
        return;
    }

    if (!authData.user) {
        console.error('No user returned');
        return;
    }

    console.log('Admin user created with ID:', authData.user.id);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!');

    // Update the profile to ensure role is admin
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', authData.user.id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
    } else {
        console.log('Admin profile role set successfully!');
    }
}

createAdmin();
