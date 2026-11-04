'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    marketingConsent?: boolean
  ) => Promise<{ error?: string; user?: User | null }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error?: string; success?: boolean }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string; success?: boolean }>;
  updateProfile: (fullName: string, phone: string) => Promise<{ error?: string; success?: boolean }>;
  toggleMarketingConsent: (consent: boolean) => Promise<{ error?: string; success?: boolean }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user profile from public.profiles
  const fetchProfile = useCallback(async (userId: string) => {
    if (!isSupabaseConfigured()) {
      // Mock profile for offline demo
      setProfile({
        id: userId,
        full_name: 'Customer Demo',
        email: 'customer@brandname.pk',
        phone: '03001234567',
        marketing_consent: true,
        consent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);

        // Link past guest orders in background
        if (data.phone || data.email) {
          (supabase as any).rpc('link_guest_orders_to_customer', {
            _user_id: userId,
            _phone: data.phone || null,
            _email: data.email || null,
          }).then(() => {
            // Linked silently
          }).catch((e: any) => console.warn('Order linking error:', e));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch profile:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // 2. Auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign In with Email & Password
  const signInWithPassword = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const mockUser = {
        id: 'cust-demo-123',
        email,
        app_metadata: {},
        user_metadata: { full_name: 'Customer Demo' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(mockUser);
      fetchProfile(mockUser.id);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred during sign in.' };
    }
  };

  // Sign Up with Email, Password, Name, Phone & Marketing Consent
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    marketingConsent = false
  ) => {
    const cleanEmail = email.trim();
    const cleanPhone = phone?.trim() || null;

    if (!isSupabaseConfigured()) {
      const mockUser = {
        id: 'cust-demo-' + Date.now(),
        email: cleanEmail,
        app_metadata: {},
        user_metadata: { full_name: fullName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as unknown as User;
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        full_name: fullName,
        email: cleanEmail,
        phone: cleanPhone,
        marketing_consent: marketingConsent,
        consent_at: marketingConsent ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      });
      return { user: mockUser };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: cleanPhone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Update profile record with phone & marketing consent
        await (supabase as any)
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: cleanEmail,
            phone: cleanPhone,
            marketing_consent: marketingConsent,
            consent_at: marketingConsent ? new Date().toISOString() : null,
          });

        await fetchProfile(data.user.id);
      }

      return { user: data.user };
    } catch (err: any) {
      return { error: err.message || 'An error occurred during registration.' };
    }
  };

  // Sign In with Google OAuth
  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase credentials are not configured yet.' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to initialize Google login.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Forgot Password / Reset Link
  const resetPasswordForEmail = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: error.message };
      return { success: true };
    } catch (err: any) {
      return { error: err.message || 'Failed to send password reset email.' };
    }
  };

  // Update Password
  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return { success: true };
    } catch (err: any) {
      return { error: err.message || 'Failed to update password.' };
    }
  };

  // Update Profile details
  const updateProfile = async (fullName: string, phone: string) => {
    if (!user) return { error: 'Not authenticated' };

    if (!isSupabaseConfigured()) {
      setProfile((prev) => (prev ? { ...prev, full_name: fullName, phone } : null));
      return { success: true };
    }

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', user.id);

      if (error) return { error: error.message };
      await fetchProfile(user.id);
      return { success: true };
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile.' };
    }
  };

  // Toggle Marketing Consent
  const toggleMarketingConsent = async (consent: boolean) => {
    if (!user) return { error: 'Not authenticated' };

    if (!isSupabaseConfigured()) {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              marketing_consent: consent,
              consent_at: consent ? new Date().toISOString() : prev.consent_at,
            }
          : null
      );
      return { success: true };
    }

    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          marketing_consent: consent,
          consent_at: consent ? new Date().toISOString() : null,
        })
        .eq('id', user.id);

      if (error) return { error: error.message };
      await fetchProfile(user.id);
      return { success: true };
    } catch (err: any) {
      return { error: err.message || 'Failed to update consent.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signInWithPassword,
        signUp,
        signInWithGoogle,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        toggleMarketingConsent,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
