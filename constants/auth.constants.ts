import { UserRole } from '@/lib/types';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'admin': 3,
  'editor': 2,
  'viewer': 1
} as const;

export const ERROR_MESSAGES = {
  SESSION_ERROR: 'Error al verificar autenticación',
  SIGN_IN_ERROR: 'Error al iniciar sesión',
  SIGN_OUT_ERROR: 'Error al cerrar sesión',
  PROFILE_ERROR: 'Error al obtener perfil de usuario'
} as const; 