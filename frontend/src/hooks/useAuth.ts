// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export type UserRole = 'admin' | 'photographer' | null;

// Hardcode admin emails — kalau email ini login, langsung jadi admin
const ADMIN_EMAILS = ['admin@marryland.com'];

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const determineRole = (u: User | null): UserRole => {
    if (!u) return null;
    if (ADMIN_EMAILS.includes(u.email || '')) return 'admin';
    return 'photographer';
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(determineRole(session?.user ?? null));
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(determineRole(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setRole(null);
    await supabase.auth.signOut();
  };

  const isAdmin = role === 'admin';

  return { user, session, loading, role, isAdmin, signInWithGoogle, signOut };
}
