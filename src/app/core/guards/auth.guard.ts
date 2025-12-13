import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { filter, take, switchMap } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const requiredRoles = (route.data?.['roles'] as string[] | undefined) ?? [];

    return combineLatest([authService.user$, authService.backendUser$]).pipe(
        filter(([user]) => user !== undefined),
        take(1),
        switchMap(async ([user, backendUser]) => {
            if (!user) {
                authService.clearBackendUser();
                return router.createUrlTree(['/auth/login']);
            }

            if (!user.email) {
                return router.createUrlTree(['/auth/login']);
            }

            const googleId = user.providerData[0]?.uid || user.uid;
            let resolvedBackendUser = backendUser;

            try {
                resolvedBackendUser = await authService.verifyUser(googleId, user.email);
            } catch (error: any) {
                return handleBackendError(error, router);
            }

            if (requiredRoles.length > 0 && !roleMatches(requiredRoles, resolvedBackendUser?.rol)) {
                return router.createUrlTree(['/auth/access-denied']);
            }

            return true;
        })
    );
};

function roleMatches(allowedRoles: string[], backendRole?: string): boolean {
    const normalizedBackend = normalizeRole(backendRole);
    return allowedRoles.some(role => normalizeRole(role) === normalizedBackend);
}

function normalizeRole(role?: string): string {
    return (role || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function handleBackendError(error: any, router: Router): UrlTree {
    if (error?.status === 403) {
        const msg = error.error?.mensaje || '';
        const isPending = msg.includes('revisión') || msg.includes('verificada');
        const statusState = isPending ? 'Pendiente' : 'Bloqueada';
        return router.createUrlTree(['/auth/status'], { queryParams: { state: statusState } });
    }

    if (error?.status === 404) {
        return router.createUrlTree(['/auth/register']);
    }

    return router.createUrlTree(['/auth/login']);
}
