import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware para proteger rutas
export function middleware(request: NextRequest) {
  // Verificar la ruta actual
  const path = request.nextUrl.pathname;
  
  // Verificar si estamos en producción
  const isProduction = process.env.NODE_ENV === 'production';
  
  // En producción, redirigir todo el tráfico público a /registro 
  // excepto la propia página de registro y recursos estáticos
  if (isProduction) {
    // Verificamos si el usuario proviene de origen interno
    const isInternalUser = isInternalRequest(request);
    
    // Si NO es un usuario interno y la ruta NO es /registro (y no son recursos estáticos),
    // redirigir a /registro
    if (!isInternalUser && 
        //path !== '/registro' && 
        !path.startsWith('/registro') && 
        !path.startsWith('/_next') && 
        !path.startsWith('/favicon') && 
        !path.startsWith('/api')) {
      
      // Creamos URL para redirección a registro
      const redirectUrl = new URL('/registro', request.url);
      
      // Devolvemos la redirección
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // Si la ruta es /comite o /admin, verificamos autenticación
  if (path.startsWith('/comite') || path.startsWith('/admin')) {
    // Verificamos si el usuario proviene de origen interno
    const isInternalUser = isInternalRequest(request);
    
    // Si no es un usuario interno, redirigir a la página de registro
    if (!isInternalUser) {
      // Creamos URL para redirección a registro
      const redirectUrl = new URL('/registro', request.url);
      
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 