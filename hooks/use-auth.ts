import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, UserRole } from '@/lib/types';

// Cache para perfiles de usuario
const profileCache = new Map<string, {role: string, timestamp: number}>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar la sesión actual
    const checkSession = async () => {
      // Reducir el timeout a 5 segundos (era 10)
      const timeoutId = setTimeout(() => {
        console.log('Timeout de seguridad: forzando fin de carga');
        setLoading(false);
      }, 5000);
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session?.user) {
          try {
            const userId = session.user.id;
            const userEmail = session.user.email!;
            
            // Verificar si hay datos en caché
            const cachedProfile = profileCache.get(userId);
            if (cachedProfile && (Date.now() - cachedProfile.timestamp < CACHE_EXPIRY)) {
              // Usar datos en caché si son recientes
              setUser({
                id: userId,
                email: userEmail,
                role: cachedProfile.role as UserRole
              });
              setLoading(false);
              clearTimeout(timeoutId);
              return;
            }
            
            // Seleccionar solo los campos necesarios de la base de datos
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', userId)
              .single();
              
            if (profileError) {
              if (profileError.code === 'PGRST116') {
                // Si el perfil no existe, crear uno básico con role 'viewer'
                const { data: newProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert([{ id: userId, email: userEmail, role: 'viewer' }])
                  .select('role')
                  .single();
                  
                if (createError) {
                  throw createError;
                }
                
                const role = newProfile?.role || 'viewer';
                
                // Guardar en caché
                profileCache.set(userId, {
                  role,
                  timestamp: Date.now()
                });
                
                setUser({
                  id: userId,
                  email: userEmail,
                  role: role as UserRole
                });
              } else {
                throw profileError;
              }
            } else if (profile) {
              const role = profile.role || 'viewer';
              
              // Guardar en caché
              profileCache.set(userId, {
                role,
                timestamp: Date.now()
              });
              
              setUser({
                id: userId,
                email: userEmail,
                role: role as UserRole
              });
            } else {
              setUser({
                id: userId,
                email: userEmail,
                role: 'viewer' as UserRole
              });
            }
          } catch (profileError) {
            console.error('Error al cargar el perfil:', profileError);
            setError('Error al cargar el perfil del usuario');
            
            // A pesar del error, establecer el usuario con rol por defecto
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: 'viewer' as UserRole
            });
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error al verificar la sesión:', err);
        setError('Error al verificar la autenticación');
        setUser(null);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    checkSession();

    // Escuchar cambios en la autenticación con optimizaciones
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(true);
        
        // Reducir el timeout a 5 segundos (era 10)
        const timeoutId = setTimeout(() => {
          console.log('Timeout de seguridad en onAuthStateChange: forzando fin de carga');
          setLoading(false);
        }, 5000);
        
        try {
          const userId = session.user.id;
          const userEmail = session.user.email!;
          
          // Verificar si hay datos en caché
          const cachedProfile = profileCache.get(userId);
          if (cachedProfile && (Date.now() - cachedProfile.timestamp < CACHE_EXPIRY)) {
            // Usar datos en caché si son recientes
            setUser({
              id: userId,
              email: userEmail,
              role: cachedProfile.role as UserRole
            });
            setLoading(false);
            clearTimeout(timeoutId);
            return;
          }
          
          // Seleccionar solo los campos necesarios
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
            
          if (profileError) {
            if (profileError.code === 'PGRST116') {
              // Si el perfil no existe, crear uno básico
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert([{ id: userId, email: userEmail, role: 'viewer' }])
                .select('role')
                .single();
                
              if (createError) {
                throw createError;
              }
              
              const role = newProfile?.role || 'viewer';
              
              // Guardar en caché
              profileCache.set(userId, {
                role,
                timestamp: Date.now()
              });
              
              setUser({
                id: userId,
                email: userEmail,
                role: role as UserRole
              });
            } else {
              throw profileError;
            }
          } else if (profile) {
            const role = profile.role || 'viewer';
            
            // Guardar en caché
            profileCache.set(userId, {
              role,
              timestamp: Date.now()
            });
            
            setUser({
              id: userId,
              email: userEmail,
              role: role as UserRole
            });
          } else {
            setUser({
              id: userId,
              email: userEmail,
              role: 'viewer' as UserRole
            });
          }
        } catch (err) {
          console.error('Error al actualizar el perfil:', err);
          setError('Error al actualizar el perfil del usuario');
          
          // A pesar del error, establecer el usuario como autenticado
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: 'viewer' as UserRole
          });
        } finally {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Limpiar caché al cerrar sesión
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
    
    // Timeout de 8 segundos para evitar que se quede cargando indefinidamente
    const timeoutId = setTimeout(() => {
      console.log('Timeout de seguridad en signIn: forzando fin de carga');
      setLoading(false);
      setError('La operación tardó demasiado tiempo. Por favor, intente nuevamente.');
    }, 8000); // 8 segundos para dar más tiempo
    
    try {
      // Proceder directamente con el inicio de sesión sin verificación previa
      // que estaba causando el error 401 Unauthorized
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
      }
      
      // Iniciar sesión exitoso (no desactivamos loading aquí porque onAuthStateChange lo hará)
      console.log('Inicio de sesión exitoso, esperando actualización de estado...');
      
      // Limpiamos el timeout para evitar problemas
      clearTimeout(timeoutId);
      
      // No hacemos setLoading(false) aquí para permitir que onAuthStateChange maneje la actualización completa
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setLoading(false);
      clearTimeout(timeoutId);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      // Limpiar caché al cerrar sesión
      profileCache.clear();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      throw err;
    }
  };

  const hasRole = (requiredRole: UserRole) => {
    if (!user) return false;
    
    // Map para hacer búsqueda O(1) en vez de comparaciones repetidas
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