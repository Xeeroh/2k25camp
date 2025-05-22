import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';
import { authService } from '@/services/auth.service';
import { ERROR_MESSAGES, ROLE_HIERARCHY } from '@/constants/auth.constants';

// Constantes
const ROLE_HIERARCHY: Record<UserRole, number> = {
  'admin': 3,
  'editor': 2,
  'viewer': 1
};

const ERROR_MESSAGES = {
  SESSION_ERROR: 'Error al verificar autenticación',
  SIGN_IN_ERROR: 'Error al iniciar sesión',
  SIGN_OUT_ERROR: 'Error al cerrar sesión',
  PROFILE_ERROR: 'Error al obtener perfil de usuario'
} as const;

// Servicios
const authService = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getUserProfile(userId: string) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (error) throw error;
    return profile;
  },

  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// Hook principal
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateUserState = async (session: any) => {
    if (!session?.user) {
      setUser(null);
      return;
    }

    try {
      const profile = await authService.getUserProfile(session.user.id);
      setUser({
        id: session.user.id,
        email: session.user.email || '',
        role: profile?.role || 'viewer'
      });
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      setError(ERROR_MESSAGES.PROFILE_ERROR);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const session = await authService.getSession();
        await updateUserState(session);
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        setError(ERROR_MESSAGES.SESSION_ERROR);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        await updateUserState(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await authService.signInWithPassword(email, password);
      await updateUserState(data);
      
      return data;
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message || ERROR_MESSAGES.SIGN_IN_ERROR);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError(ERROR_MESSAGES.SIGN_OUT_ERROR);
      throw err;
    }
  };

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    const userRoleLevel = ROLE_HIERARCHY[user.role];
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];
    
    return userRoleLevel >= requiredRoleLevel;
  };

  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    hasRole
  };
} 