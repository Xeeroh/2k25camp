import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Función para verificar si es una solicitud interna
const isInternalRequest = (request: NextRequest) => {
  const internalAccess = request.nextUrl.searchParams.get('internal_access');
  const internalHeader = request.headers.get('x-internal-access');
  return internalAccess === 'true' || internalHeader === 'true';
};

// Middleware para proteger rutas
export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });
  
  // Verificar la ruta actual
  const path = request.nextUrl.pathname;
  
  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/registro', '/_next', '/favicon', '/api', '/'];
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath));

  // Si es una solicitud interna, permitir el acceso
  if (isInternalRequest(request)) {
    return res;
  }

  // Verificar la sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si estamos en la ruta raíz y no hay sesión, redirigir a registro
  if (path === '/' && !session) {
    const redirectUrl = new URL('/registro', request.url);
    redirectUrl.searchParams.set('from', '/');
    return NextResponse.redirect(redirectUrl);
  }

  // Si no hay sesión y la ruta requiere autenticación
  if (!session && !isPublicPath) {
    // Si estamos en la página de admin, permitir el acceso para mostrar el formulario de login
    if (path === '/admin') {
      return res;
    }
    // Para otras rutas protegidas, redirigir a registro
    const redirectUrl = new URL('/registro', request.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión, verificar roles
  if (session) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) {
        console.error('Error al obtener perfil:', error);
        return res;
      }

      // Verificar acceso a /comite
      if (path.startsWith('/comite')) {
        if (!profile || (profile.role !== 'editor' && profile.role !== 'admin')) {
          const redirectUrl = new URL('/registro', request.url);
          redirectUrl.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(redirectUrl);
        }
      }

      // Verificar acceso a rutas de admin (excepto la página principal de admin)
      if (path.startsWith('/admin') && path !== '/admin') {
        if (!profile || profile.role !== 'admin') {
          const redirectUrl = new URL('/registro', request.url);
          redirectUrl.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(redirectUrl);
        }
      }
    } catch (error) {
      console.error('Error al verificar rol:', error);
      return res; // En caso de error, permitir el acceso en lugar de redirigir
    }
  }
  
  return res;
}

// Configuración de rutas para aplicar el middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}; 