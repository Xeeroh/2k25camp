import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware para proteger rutas
export function middleware(request: NextRequest) {
  // Verificar si la ruta es para comité o admin
  const path = request.nextUrl.pathname;
  
  // Si la ruta es /comite o /admin, verificamos autenticación
  if (path.startsWith('/comite') || path.startsWith('/admin')) {
    // Verificamos si el usuario proviene de origen interno
    const isInternalUser = isInternalRequest(request);
    
    // Si no es un usuario interno, redirigir a la página principal
    if (!isInternalUser) {
      // Creamos URL para redirección a la página principal
      const redirectUrl = new URL('/', request.url);
      
      // Devolvemos la redirección
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // Para todas las demás rutas, permitir acceso
  return NextResponse.next();
}

// Función para verificar si la solicitud proviene de un origen interno
function isInternalRequest(request: NextRequest): boolean {
  // En producción, aquí puedes implementar la lógica para verificar direcciones IP internas,
  // encabezados de acceso, o tokens específicos
  
  // Verificamos el encabezado X-Internal-Access si existe
  const internalAccessHeader = request.headers.get('x-internal-access');
  if (internalAccessHeader === 'true') {
    return true;
  }
  
  // Verificamos si la solicitud proviene del mismo origen (desarrollo local)
  const referer = request.headers.get('referer');
  if (referer && (referer.includes('localhost') || referer.includes('127.0.0.1'))) {
    return true;
  }
  
  // Por defecto, en desarrollo permitiremos el acceso a estas rutas si se incluye un parámetro especial
  // Esto es útil para pruebas
  const url = new URL(request.url);
  const internalAccess = url.searchParams.get('internal_access');
  if (internalAccess === 'true') {
    return true;
  }
  
  // En un entorno de producción, podrías verificar rangos de IP específicos
  // const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  // if (isInternalIpAddress(clientIp)) {
  //   return true;
  // }
  
  // Por defecto, consideramos que no es una solicitud interna
  return false;
}

// Configuración de rutas para aplicar el middleware
export const config = {
  matcher: ['/comite/:path*', '/admin/:path*'],
}; 