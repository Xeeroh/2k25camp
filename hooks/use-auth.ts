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
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []); // Mantener un solo punto de control de mounted si es necesario, pero lo simplificaré abajo

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
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        console.log('Iniciando autenticación...');
        setLoading(true);
        
        // Agregar un timeout para no quedarse trabado en redes inestables
        const sessionPromise = authService.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout al obtener sesión')), 5000)
        );

        const session = await Promise.race([sessionPromise, timeoutPromise]).catch(err => {
          console.warn('Advertencia:', err.message);
          return null;
        }) as any;

        console.log('Sesión obtenida o timeout reached');
        
        await updateUserState(session);

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Cambio de autenticación:', event);
          
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
        console.error('Error en initializeAuth:', err);
        setError(ERROR_MESSAGES.SESSION_ERROR);
        setUser(null);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      mounted.current = false;
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
      console.log('Iniciando signOut...');
      setLoading(true);
      setError(null);
      
      await authService.signOut();
      console.log('signOut exitoso');
      
      setUser(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err);
      
      if (err.message?.includes('Auth session missing') || err.message?.includes('No session')) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      setError(ERROR_MESSAGES.SIGN_OUT_ERROR);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
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