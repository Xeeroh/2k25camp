import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';

// Cache para perfiles de usuario
const profileCache = new Map<string, {role: string, timestamp: number}>();
const CACHE_EXPIRY = 2 * 60 * 1000; // Reducido a 2 minutos

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Función simplificada para obtener perfil
    const fetchUserProfile = async (userId: string, userEmail: string) => {
      try {
        // Limpiar caché expirado
        const now = Date.now();
        Array.from(profileCache.keys()).forEach(key => {
          const value = profileCache.get(key);
          if (value && now - value.timestamp > CACHE_EXPIRY) {
            profileCache.delete(key);
          }
        });

        // Verificar caché primero
        const cachedProfile = profileCache.get(userId);
        if (cachedProfile && (Date.now() - cachedProfile.timestamp < CACHE_EXPIRY)) {
          return cachedProfile.role as UserRole;
        }

        // Consultar perfil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (!mounted) return 'viewer';

        // Si existe, usarlo
        if (profile) {
          const role = profile.role || 'viewer';
          profileCache.set(userId, { role, timestamp: Date.now() });
          return role as UserRole;
        }

        // Si no existe, crear perfil por defecto
        if (profileError && profileError.code === 'PGRST116') {
          await supabase
            .from('profiles')
            .insert([{ id: userId, email: userEmail, role: 'viewer' }]);
          
          if (!mounted) return 'viewer';
          
          profileCache.set(userId, { role: 'viewer', timestamp: Date.now() });
          return 'viewer' as UserRole;
        }

        return 'viewer' as UserRole;
      } catch (err) {
        console.error('Error al obtener perfil:', err);
        return 'viewer' as UserRole;
      }
    };

    // Comprobar sesión actual de forma simplificada
    const checkCurrentSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (sessionError) {
          console.error('Error al obtener sesión:', sessionError);
          setUser(null);
          setError('Error al verificar autenticación');
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          
          // Obtener rol
          const role = await fetchUserProfile(userId, userEmail);
          
          if (!mounted) return;
          
          // Establecer usuario
          setUser({
            id: userId,
            email: userEmail,
            role
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        if (mounted) {
          setUser(null);
          setError('Error al verificar autenticación');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Verificar sesión al cargar
    checkCurrentSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        const userEmail = session.user.email || '';
        
        // Obtener rol
        const role = await fetchUserProfile(userId, userEmail);
        
        if (!mounted) return;
        
        // Establecer usuario
        setUser({
          id: userId,
          email: userEmail,
          role
        });
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          profileCache.clear();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // No necesitamos establecer el usuario aquí, lo hará onAuthStateChange
      return data;
    } catch (err: any) {
      setLoading(false);
      console.error('Error al iniciar sesión:', err);
      
      // Establecer mensaje de error más descriptivo
      if (err.message?.includes('Invalid login credentials')) {
        setError('Credenciales inválidas');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Email no confirmado');
      } else {
        setError(err.message || 'Error desconocido al iniciar sesión');
      }
      
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      profileCache.clear();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setError('Error al cerrar sesión');
      throw err;
    }
  };

  const hasRole = (requiredRole: UserRole) => {
    if (!user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      'admin': 3,
      'editor': 2,
      'viewer': 1
    };
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
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