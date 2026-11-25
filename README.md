# TP Red Social

Aplicación web de red social con feed de publicaciones, comentarios, "me gusta", perfiles de usuario y un panel de administración con gestión de usuarios y estadísticas. El proyecto está dividido en dos aplicaciones independientes: un frontend en Angular y un backend en NestJS con MongoDB.

## Tecnologías

**Frontend**

- Angular 22 (componentes standalone, signals y control flow `@if`/`@for`).
- Angular Material y CDK para la interfaz (toolbar, tarjetas, diálogos, tablas, paginadores, snackbars, menú, etc.).
- Chart.js + ng2-charts para los gráficos del panel de administración.
- Service worker / PWA (habilitado en producción).
- TypeScript, SCSS, RxJS, Vitest + jsdom para pruebas, Prettier.
- Despliegue configurado para Vercel.

**Backend**

- NestJS 12 con Express, TypeScript y ESM.
- MongoDB con Mongoose (`@nestjs/mongoose`) y configuración mediante variables de entorno.
- Autenticación con JWT y contraseñas hasheadas con bcrypt.
- Guardias personalizados para JWT y rol de administrador.
- Subida de archivos con Multer (imágenes en disco, servidas desde `/uploads`).
- Validación global de DTOs con `class-validator` / `class-transformer`.
- Vitest + Supertest para pruebas unitarias y e2e, oxlint y Prettier.

## Estructura del proyecto

```text
tp-red-social/
├── backend/     API REST (NestJS + MongoDB)
├── frontend/    aplicación web (Angular)
└── README.md    este archivo
```

## Frontend

El frontend tiene rutas protegidas por guardias de autenticación y de administrador, además de un interceptor que agrega el token JWT a cada petición y cierra la sesión ante un `401`. El token y los datos del usuario se guardan en `localStorage`.

### Pantallas

| Ruta | Descripción |
| --- | --- |
| `/login` | Inicio de sesión con correo o nombre de usuario y contraseña. |
| `/registro` | Registro con foto de perfil opcional, fecha de nacimiento y biografía. |
| `/publicaciones` | Feed paginado con orden por fecha o por likes; permite crear publicaciones. |
| `/publicacion/:id` | Detalle de una publicación con sus comentarios paginados. |
| `/mi-perfil` | Perfil propio con datos, foto, roles y últimas publicaciones. |
| `/dashboard/usuarios` | Panel de administración de usuarios. |
| `/dashboard/estadisticas` | Panel de estadísticas con gráficos y filtro por rango de fechas. |

### Elementos compartidos

- Barra de navegación responsive con menú de usuario (mi perfil / cerrar sesión) y enlaces de administración visibles solo para administradores.
- Pantalla de carga inicial mientras se valida la sesión.
- Diálogo de confirmación para acciones destructivas, directivas para resaltar estados y mostrar imágenes con fallback, y pipes para texto, fechas relativas y estado de usuario.
- Servicios para autenticación, sesión, publicaciones, usuarios, estadísticas y notificaciones.

## Qué puede hacer el usuario

- Registrarse (con imagen de perfil opcional) e iniciar sesión.
- Ver el feed de publicaciones, ordenarlo por más recientes o más populares y paginar los resultados.
- Crear publicaciones con título, mensaje e imagen opcional.
- Dar y quitar "me gusta" a publicaciones.
- Comentar publicaciones, ver los comentarios paginados y editar sus propios comentarios.
- Eliminar sus propias publicaciones.
- Ver y editar su perfil (nombre, apellido, fecha de nacimiento, biografía y foto).
- Extender la sesión cuando se le avisa de que está por expirar, y cerrar sesión.

## Qué puede hacer el administrador

Todo lo que puede hacer un usuario, más:

- Acceder a las rutas `/dashboard/*`, restringidas mediante `adminGuard`.
- Ver el listado completo de usuarios.
- Crear nuevos usuarios eligiendo el perfil `usuario` o `administrador`.
- Deshabilitar y volver a habilitar cuentas de usuario.
- Consultar estadísticas por rango de fechas: publicaciones por usuario, comentarios por período y comentarios por publicación, con gráficos de barras, línea y dona.
- Eliminar cualquier publicación, no solo las propias.

## Backend

### Módulos y endpoints

**Autenticación (`/auth`, público)**

| Método | Endpoint | Descripción |
| --- | --- | --- |
| POST | `/auth/registro` | Registra un usuario (con imagen opcional) y devuelve token. |
| POST | `/auth/login` | Inicia sesión con correo o nombre de usuario y contraseña. |
| POST | `/auth/autorizar` | Valida el token y devuelve los datos del usuario. |
| POST | `/auth/refrescar` | Genera un nuevo token con los mismos datos. |

**Usuarios (`/usuarios`, requiere JWT)**

| Método | Endpoint | Permisos | Descripción |
| --- | --- | --- | --- |
| GET | `/usuarios` | Admin | Lista todos los usuarios. |
| POST | `/usuarios` | Admin | Crea un usuario con perfil elegido. |
| DELETE | `/usuarios/:id` | Admin | Deshabilita un usuario. |
| POST | `/usuarios/:id/habilitar` | Admin | Reactiva un usuario. |
| GET | `/usuarios/:id` | JWT | Obtiene un usuario por id. |
| PATCH | `/usuarios/:id` | Dueño o admin | Actualiza datos y foto de perfil. |

**Publicaciones (`/publicaciones`, requiere JWT)**

| Método | Endpoint | Permisos | Descripción |
| --- | --- | --- | --- |
| POST | `/publicaciones` | JWT | Crea una publicación con imagen opcional. |
| GET | `/publicaciones` | JWT | Lista publicaciones con filtros y paginación. |
| GET | `/publicaciones/:id` | JWT | Devuelve el detalle de una publicación. |
| POST | `/publicaciones/:id/like` | JWT | Agrega un me gusta. |
| DELETE | `/publicaciones/:id/like` | JWT | Quita un me gusta. |
| POST | `/publicaciones/:id/comentarios` | JWT | Agrega un comentario. |
| GET | `/publicaciones/:id/comentarios` | JWT | Lista comentarios paginados. |
| PUT | `/publicaciones/:pubId/comentarios/:commentId` | Autor del comentario | Edita un comentario. |
| DELETE | `/publicaciones/:id` | Autor o admin | Elimina (lógicamente) una publicación. |

**Estadísticas (`/estadisticas`, requiere JWT + admin)**

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/estadisticas/publicaciones-por-usuario` | Cantidad de publicaciones por usuario en un período. |
| GET | `/estadisticas/comentarios-por-periodo` | Cantidad de comentarios agrupados por día. |
| GET | `/estadisticas/comentarios-por-publicacion` | Cantidad de comentarios por publicación. |

Los tres endpoints reciben `fechaInicio` y `fechaFin` como parámetros de consulta.

**Otros**

- `GET /`: endpoint de prueba que devuelve "Hello World!".
- `GET /uploads/:filename`: sirve públicamente las imágenes subidas.

### Modelos de datos

- **Usuario**: nombre, apellido, correo y nombre de usuario (únicos), contraseña hasheada, fecha de nacimiento, descripción, imagen de perfil, perfil (`usuario` o `administrador`) y estado activo. La contraseña no se devuelve en las respuestas.
- **Publicación**: título, mensaje, imagen, autor (referencia al usuario), lista de me gusta, comentarios incrustados, estado activo y fechas de creación/actualización.
- **Comentario**: autor, texto, fecha e indicador de modificación; está incrustado dentro de la publicación.

### Otros detalles del backend

- Las bajas de usuarios y publicaciones son lógicas (cambian el campo `activo`).
- Las imágenes se validan por tipo MIME (jpg, jpeg, png, gif, webp) y tamaño máximo de 5 MB.
- Las contraseñas se guardan con bcrypt y el token JWT se firma con una clave definida en el entorno.
- Existe un script `seed:admin` que crea el usuario administrador (o promueve uno existente) usando variables `ADMIN_*`.
- Las pruebas cubren autenticación, tokens, comentarios, el endpoint raíz y un caso e2e.

