import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'publicaciones' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/registro/registro.component').then(
        (m) => m.RegistroComponent,
      ),
  },
  {
    path: 'publicaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/publicaciones/publicaciones.component').then(
        (m) => m.PublicacionesComponent,
      ),
  },
  {
    path: 'publicacion/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/publicaciones/publicacion-detalle/publicacion-detalle.component'
      ).then((m) => m.PublicacionDetalleComponent),
  },
  {
    path: 'mi-perfil',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/mi-perfil/mi-perfil.component').then(
        (m) => m.MiPerfilComponent,
      ),
  },
  {
    path: 'dashboard/usuarios',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/dashboard/usuarios/usuarios.component').then(
        (m) => m.UsuariosComponent,
      ),
  },
  {
    path: 'dashboard/estadisticas',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/dashboard/estadisticas/estadisticas.component').then(
        (m) => m.EstadisticasComponent,
      ),
  },
  { path: '**', redirectTo: 'publicaciones' },
];
