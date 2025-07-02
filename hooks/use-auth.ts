import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';
import { authService } from '@/services/auth.service';
import { ERROR_MESSAGES, ROLE_HIERARCHY } from '@/constants/auth.constants';

// Hook principal
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const isUpdating = useRef(false);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const updateUserState = async (session: any) => {
    if (isUpdating.current) return;
    isUpdating.current = true;

    try {
      if (!session?.user) {
        if (mounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const profile = await authService.getUserProfile(session.user.id);
      
      if (mounted.current) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          role: profile?.role || 'viewer'
        });
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al obtener perfil:', err);
      if (mounted.current) {
        setError(ERROR_MESSAGES.PROFILE_ERROR);
        setUser(null);
        setLoading(false);
      }
    } finally {
      isUpdating.current = false;
    }
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const initializeAuth = async () => {
      try {
        if (!mounted.current) return;
        
        setLoading(true);
        const session = await authService.getSession();
        await updateUserState(session);

        // Configurar suscripción a cambios de autenticación
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event);
          
          if (!mounted.current) return;

          if (event === 'SIGNED_IN') {
            await updateUserState(session);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setLoading(false);
          }
        });

        subscription = authSubscription;
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        if (mounted.current) {
          setError(ERROR_MESSAGES.SESSION_ERROR);
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
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
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await authService.signOut();
      
      if (mounted.current) {
        setUser(null);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      
      // Si el error es que no hay sesión, no es realmente un error
      if (err.message?.includes('Auth session missing') || err.message?.includes('No session')) {
        console.log('Sesión ya cerrada o no existía');
        if (mounted.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      
      setError(ERROR_MESSAGES.SIGN_OUT_ERROR);
      throw err;
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
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