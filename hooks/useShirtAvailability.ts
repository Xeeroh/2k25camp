import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useShirtAvailability = () => {
  const [shirtAvailable, setShirtAvailable] = useState<boolean | null>(() => {
    // Límite de tiempo: 3 de Julio, 2026 a las 10:00 PM hora Tijuana (UTC-7) -> 4 de Julio, 2026 05:00:00 UTC
    const deadline = new Date('2026-07-04T05:00:00Z').getTime();
    return Date.now() >= deadline ? false : null;
  });
  const [checkingShirts, setCheckingShirts] = useState(false);

  const checkShirtAvailability = async () => {
    try {
      setCheckingShirts(true);
      
      // Límite de tiempo: 3 de Julio, 2026 a las 10:00 PM hora Tijuana (UTC-7) -> 4 de Julio, 2026 05:00:00 UTC
      const deadline = new Date('2026-07-04T05:00:00Z').getTime();
      if (Date.now() >= deadline) {
        setShirtAvailable(false);
        return;
      }

      const { count } = await supabase
        .from('attendees')
        .select('*', { count: 'exact', head: true });
      
      const areTshirtsAvailable = count !== null && count < 100;
      setShirtAvailable(areTshirtsAvailable);
    } catch (error) {
      console.error('Error al verificar disponibilidad de camisetas:', error);
      setShirtAvailable(null);
    } finally {
      setCheckingShirts(false);
    }
  };

  useEffect(() => {
    checkShirtAvailability();
  }, []);

  return {
    shirtAvailable,
    checkingShirts,
    checkShirtAvailability
  };
}; 