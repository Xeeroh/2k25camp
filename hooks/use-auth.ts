import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';

// Cache para perfiles de usuario
const profileCache = new Map<string, {role: string, timestamp: number}>();
const CACHE_EXPIRY = 2 * 60 * 1000; // 2 minutos

// Función para limpiar el caché
const clearCache = () => {
  profileCache.clear();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.clear();
  }
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para reconectar
  const reconnect = async () => {
    try {
      clearCache();
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
      console.error('Error al reconectar:', err);
      setUser(null);
      setError('Error al reconectar');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    // Comprobar sesión actual
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
        setUser(null);
        clearCache();
      } else if (event === 'TOKEN_REFRESHED') {
        // Reconectar cuando se refresca el token
        await reconnect();
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
      clearCache(); // Limpiar caché antes de iniciar sesión
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return data;
    } catch (err: any) {
      setLoading(false);
      console.error('Error al iniciar sesión:', err);
      
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
      clearCache();
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
    hasRole,
    reconnect // Exportar la función de reconexión
  };
} 