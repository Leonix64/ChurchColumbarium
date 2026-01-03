import { Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    canActivate: [authGuard]
  },
  {
    path: 'columbarium',
    loadChildren: () => import('./pages/columbarium/columbarium.routes').then(m => m.columbariumRoutes),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
