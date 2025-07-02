# ACCESO INTERNO - 2K25 CAMP

## 🔐 Sistema de Autenticación

### Roles de Usuario
- **Admin**: Acceso completo al dashboard administrativo
- **Editor**: Acceso al comité para escaneo de QR y gestión de asistentes

### Flujo de Restablecimiento de Contraseña

El sistema de restablecimiento de contraseña funciona de la siguiente manera:

1. **Solicitud de Restablecimiento** (`/admin/reset-password`)
   - Usuario ingresa su email
   - Sistema envía enlace de restablecimiento a través de Supabase
   - URL de redirección: `${origin}/admin/reset-callback`
   - **Diseño**: Fondo `bg-try`, tarjeta `card-glass`, icono de email

2. **Procesamiento del Enlace** (`/admin/reset-callback`)
   - Captura el enlace de Supabase con tokens de autenticación
   - Espera que Supabase procese la sesión automáticamente
   - Redirige a `/admin/update-password?from_reset=true`
   - **Diseño**: Fondo `bg-try`, tarjeta `card-glass`, icono de escudo, spinner animado

3. **Actualización de Contraseña** (`/admin/update-password`)
   - Detecta si el usuario viene de un enlace de restablecimiento
   - Muestra formulario para nueva contraseña
   - Valida requisitos de seguridad (8+ caracteres, mayúscula, minúscula, número)
   - Actualiza contraseña y redirige según rol:
     - Admin → `/admin`
     - Editor → `/comite`
   - **Diseño**: Fondo `bg-try`, tarjeta `card-glass`, icono de candado, botones de mostrar/ocultar contraseña

### Características de Seguridad
- **Rate Limiting**: Protección contra spam de solicitudes
- **Validación de Tokens**: Verificación de enlaces válidos y no expirados
- **Redirección Inteligente**: Basada en rol del usuario
- **Manejo de Errores**: Mensajes claros para diferentes tipos de errores
- **Interfaz de Usuario**: Diseño consistente con el resto de la aplicación

### URLs del Sistema
- **Login Admin**: `/admin`
- **Login Comité**: `/comite`
- **Restablecimiento**: `/admin/reset-password`
- **Callback**: `/admin/reset-callback`
- **Actualización**: `/admin/update-password`

### Configuración de Supabase
Para que el restablecimiento funcione correctamente, verificar en el dashboard de Supabase:

1. **Auth > URL Configuration**
   - Site URL: `http://localhost:3000` (desarrollo)
   - Redirect URLs: 
     - `http://localhost:3000/admin/reset-callback`
     - `http://localhost:3000/admin/update-password`

2. **Auth > Templates > Reset Password**
   - Verificar que use la URL de redirección correcta

---

## 🎨 Sistema de Diseño

### Estilos Aplicados
- **Fondo**: `bg-try` (fondo principal de la aplicación)
- **Tarjetas**: `card-glass` (efecto de cristal con sombra)
- **Botones**: `bg-blue-850` (color principal de la marca)
- **Iconos**: Lucide React con colores consistentes
- **Formularios**: Validación visual y estados de carga

### Componentes de UI
- **Inputs**: Altura `h-11`, bordes redondeados
- **Botones**: Altura `h-11`, iconos integrados
- **Alertas**: Bordes y colores consistentes
- **Loading**: Spinners animados con iconos temáticos

---

## 📊 Dashboard Administrativo

### Funcionalidades Principales
- Gestión de asistentes
- Estadísticas de registro
- Gráficos de pagos
- Exportación de datos

### Acceso
- URL: `/admin`
- Requiere rol de administrador

---

## 📱 Comité de Escaneo

### Funcionalidades
- Escaneo de códigos QR
- Verificación de asistentes
- Gestión de caja

### Acceso
- URL: `/comite`
- Requiere rol de editor o administrador

---

## 🔧 Desarrollo

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### Comandos de Desarrollo
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Construir para producción
npm run start        # Iniciar servidor de producción
```

---

## 📝 Notas de Implementación

- El sistema utiliza Supabase para autenticación y base de datos
- Next.js 14 con App Router
- Tailwind CSS para estilos
- Shadcn/ui para componentes
- React Hook Form con Zod para validación
- Diseño responsivo y accesible
- Manejo robusto de errores y estados de carga

# Acceso a secciones internas

Este documento explica cómo acceder a las secciones de **Comité** y **Administración** que ahora están protegidas.

## Configuración actual

Hemos implementado un middleware que protege las siguientes rutas:
- `/comite/*` - Panel para miembros del comité
- `/admin/*` - Panel de administración

Solo la página principal (`/`) y la sección de **Registro** (`/registro`) son accesibles públicamente.

## Métodos para acceder a las secciones protegidas

### 1. Desarrollo local

Durante el desarrollo local (localhost), todas las secciones son accesibles sin restricciones.

### 2. Parámetro de URL

En producción, puedes acceder a las secciones protegidas agregando el parámetro `internal_access=true` a la URL:

```
https://tudominio.com/comite?internal_access=true
https://tudominio.com/admin?internal_access=true
```

### 3. Encabezado HTTP personalizado

Para acceso programático o desde aplicaciones específicas, puedes usar el encabezado HTTP:

```
X-Internal-Access: true
```

## Cómo reconocer el modo interno

Cuando estás en modo interno, verás un indicador visual ("Acceso Interno") junto al logo en la barra de navegación.

## Implementación futura

Para una implementación más segura en producción, considera:

1. Restringir acceso por rangos de IP específicos
2. Implementar un sistema de tokens de acceso
3. Usar autenticación de dos factores para estas secciones
4. Configurar VPN para acceso remoto seguro

## Modificación del acceso

Para modificar la configuración de acceso, edita el archivo `middleware.ts` y ajusta la función `isInternalRequest()` según tus necesidades. 