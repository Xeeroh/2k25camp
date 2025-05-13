import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';

// Cache para perfiles de usuario
const profileCache = new Map<string, {role: string, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false); // Iniciar como false
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Función simplificada para obtener perfil
    const fetchUserProfile = async (userId: string, userEmail: string) => {
      try {
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
          
          profileCache.set(userId, { role: 'viewer', timestamp: Date.now() });
          return 'viewer' as UserRole;
        }

        // Perfil por defecto
        return 'viewer' as UserRole;
      } catch (err) {
        console.error('Error al obtener perfil:', err);
        return 'viewer' as UserRole;
      }
    };

    // Comprobar sesión actual de forma simplificada
    const checkCurrentSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const userId = session.user.id;
          const userEmail = session.user.email || '';
          
          // Obtener rol
          const role = await fetchUserProfile(userId, userEmail);
          
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
        setUser(null);
        setError('Error al verificar autenticación');
      } finally {
        setLoading(false);
      }
    };

    // Verificar sesión al cargar
    checkCurrentSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userId = session.user.id;
        const userEmail = session.user.email || '';
        
        // Obtener rol
        const role = await fetchUserProfile(userId, userEmail);
        
        // Establecer usuario
        setUser({
          id: userId,
          email: userEmail,
          role
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        profileCache.clear();
      }
    });

    return () => {
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