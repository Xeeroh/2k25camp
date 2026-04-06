import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const getSupabase = () => supabase;

// Configurar el listener de cambios de autenticación
if (typeof window !== 'undefined') {
  let isHandlingAuth = false;

  supabase.auth.onAuthStateChange((event, session) => {
    if (isHandlingAuth) return;
    try {
      isHandlingAuth = true;
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('mdpnoroeste.auth.token');
        sessionStorage.clear();
      }
    } finally {
      isHandlingAuth = false;
    }
  });
}