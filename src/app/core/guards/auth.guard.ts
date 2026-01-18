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
            // 1. Si no hay usuario de Firebase, redirigir a login
            if (!user) {
                authService.clearBackendUser();
                return router.createUrlTree(['/auth/login']);
            }

            if (!user.email) {
                return router.createUrlTree(['/auth/login']);
            }

            const googleId = user.providerData[0]?.uid || user.uid;
            let resolvedBackendUser = backendUser;

            // 2. Solo verificar en backend si NO hay usuario cacheado
            // Esto evita llamadas API innecesarias en cada navegación
            if (!backendUser) {
                try {
                    resolvedBackendUser = await authService.verifyUser(googleId, user.email);
                } catch (error: any) {
                    return handleBackendError(error, router);
                }
            }

            // 3. Verificar estado de cuenta
            const estadoCuenta = resolvedBackendUser?.estado_cuenta || resolvedBackendUser?.estado;

            if (estadoCuenta === 'Pendiente') {
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Pendiente' } });
            }

            if (estadoCuenta === 'Bloqueada') {
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
            }

            if (estadoCuenta === 'Rechazada') {
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Rechazada' } });
            }

            // 4. Verificar rol si se requiere
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
    const status = error?.status;
    const mensaje = error?.error?.mensaje || '';

    // Usuario no registrado
    if (status === 404) {
        console.log('📝 Guard: Usuario no registrado, redirigiendo a registro');
        return router.createUrlTree(['/auth/register']);
    }

    // Usuario con problemas de estado
    if (status === 403) {
        if (mensaje.includes('Pendiente') || mensaje.includes('revisión')) {
            return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Pendiente' } });
        }
        if (mensaje.includes('bloqueada') || mensaje.includes('Bloqueada')) {
            return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
        }
        if (mensaje.includes('rechazada') || mensaje.includes('Rechazada')) {
            return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Rechazada' } });
        }
        if (mensaje.includes('eliminada')) {
            return router.createUrlTree(['/auth/login']);
        }
        return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
    }

    // Error genérico
    console.log('❌ Guard: Error desconocido');
    return router.createUrlTree(['/auth/login']);
}
