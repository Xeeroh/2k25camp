import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useShirtAvailability = () => {
  const [shirtAvailable, setShirtAvailable] = useState<boolean | null>(null);
  const [checkingShirts, setCheckingShirts] = useState(false);

  const checkShirtAvailability = async () => {
    try {
      setCheckingShirts(true);
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