import { supabase } from '@/lib/supabase';

export const authService = {
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
    try {
      console.log('Intentando cerrar sesión en Supabase...');
      // Intentar cerrar sesión en el servidor (esto puede fallar si no hay sesión)
      await supabase.auth.signOut().catch(err => console.log('Error silenciado en signOut de Supabase:', err));
      
      // Limpiar TODO rastro local de todas formas
      if (typeof window !== 'undefined') {
        console.log('Limpiando rastro local de autenticación...');
        localStorage.clear();
        sessionStorage.clear();
        // Intentar borrar cookies de auth manualmente por si acaso
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
    } catch (error) {
      console.error('Error crítico en signOut service:', error);
    }
  }
}; 