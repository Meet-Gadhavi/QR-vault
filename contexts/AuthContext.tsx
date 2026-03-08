import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null;
  userId: string | null;
  login: (email: string, password?: string) => Promise<void>;
  signup: (email: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          // Only set loading to false if we're not expecting an auth change from hash
          if (!window.location.hash.includes('access_token=')) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error getting session:", error);
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If we just signed in, we might want to ensure we're on the dashboard
        if (event === 'SIGNED_IN') {
          // The redirect logic in components will handle this
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) throw new Error("Password required for login");
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signup = async (email: string, password?: string) => {
    if (!password) throw new Error("Password required for sign up");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const loginWithGoogle = async () => {
    console.log('Initiating Google OAuth with Supabase...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
    
    if (error) {
      console.error('Supabase OAuth error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    isAuthenticated: !!user,
    userEmail: user?.email ?? null,
    userId: user?.id ?? null,
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};