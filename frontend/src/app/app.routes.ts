import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'admin', canActivate: [authGuard], loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
