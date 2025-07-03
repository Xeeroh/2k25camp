import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function getNextAttendanceNumber(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('attendees')
      .select('attendance_number')
      .not('attendance_number', 'is', null)
      .order('attendance_number', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Si no hay números asignados, comenzar desde 1
    if (!data || !data.attendance_number) {
      return 1;
    }

    // Obtener el último número y sumar 1
    return data.attendance_number + 1;
  } catch (error) {
    console.error('Error al obtener el siguiente número de asistencia:', error);
    throw error;
  }
}