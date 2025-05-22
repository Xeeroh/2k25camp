import { createClient } from '@supabase/supabase-js';

// Verificar que las variables de entorno estén definidas
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no está definido');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definido');
}

// Configuración mejorada para el cliente de Supabase
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'mdpnoroeste.auth.token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce',
      debug: false
    },
    global: {
      headers: {
        'x-application-name': 'Mensajeros De Paz Noroeste',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    },
    // Mejoras para el rendimiento y la confiabilidad
    db: {
      schema: 'public',
    },
    realtime: {
      timeout: 20000, // Aumentar el timeout para conexiones lentas
    },
  }
);

// Configurar el listener de cambios de autenticación
if (typeof window !== 'undefined') {
  let isHandlingAuth = false;

  supabase.auth.onAuthStateChange((event, session) => {
    if (isHandlingAuth) return;
    
    try {
      isHandlingAuth = true;
      console.log('Evento de autenticación:', event);
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('mdpnoroeste.auth.token');
        sessionStorage.clear();
      }
    } finally {
      isHandlingAuth = false;
    }
  });
}

// Esta función nos permite usar la misma instancia en toda la aplicación
export const getSupabase = () => supabase;

// Solo en modo desarrollo, verificar la conexión
if (process.env.NODE_ENV === 'development') {
  // Verificar la conexión
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('Error al verificar la sesión inicial:', error);
    } else {
      console.log('Estado inicial de la sesión:', session ? 'Autenticado' : 'No autenticado');
    }
  });
} 