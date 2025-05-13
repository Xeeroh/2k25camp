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