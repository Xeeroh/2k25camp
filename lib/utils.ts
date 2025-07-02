import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene el siguiente número de campista disponible (attendance_number) ignorando valores nulos.
 * @returns {Promise<number>} El siguiente número disponible (mayor + 1, o 1 si no hay registros)
 */
export async function getNextAttendanceNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('attendees')
    .select('attendance_number')
    .not('attendance_number', 'is', null)
    .order('attendance_number', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0 || !data[0].attendance_number) return 1;
  return (data[0].attendance_number || 0) + 1;
}
