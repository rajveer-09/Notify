import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getToken() && authService.isAdmin()) {
    return true;
  }
  
  // If logged in but not admin, send to dashboard
  if (authService.getToken()) {
    return router.parseUrl('/dashboard');
  }
  
  // Otherwise send to login
  return router.parseUrl('/login');
};
