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
      // Verificar si hay una sesión activa antes de intentar cerrar
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No hay sesión activa para cerrar');
        // Limpiar el almacenamiento local de todas formas
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mdpnoroeste.auth.token');
          sessionStorage.clear();
        }
        return;
      }

      // Si hay sesión, proceder con el cierre
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error);
        // Aún así, limpiar el almacenamiento local
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mdpnoroeste.auth.token');
          sessionStorage.clear();
        }
        throw error;
      }
    } catch (error) {
      console.error('Error en signOut:', error);
      // Asegurar que el almacenamiento se limpie incluso si hay error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('mdpnoroeste.auth.token');
        sessionStorage.clear();
      }
      throw error;
    }
  }
}; 