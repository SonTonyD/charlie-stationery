import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../supabase/auth.service';

export const adminAuthGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(SupabaseAuthService);
  const router = inject(Router);

  try {
    const session = await authService.getSession();
    if (session) {
      return true;
    }
  } catch {
    // noop
  }

  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirectTo: state.url },
  });
};
