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
                console.log('🔒 Guard: No hay usuario de Firebase, redirigiendo a login');
                return router.createUrlTree(['/auth/login']);
            }

            if (!user.email) {
                console.log('🔒 Guard: Usuario sin email');
                return router.createUrlTree(['/auth/login']);
            }

            const googleId = user.providerData[0]?.uid || user.uid;
            let resolvedBackendUser = backendUser;

            // 2. Verificar usuario en backend
            try {
                resolvedBackendUser = await authService.verifyUser(googleId, user.email);
                console.log('✅ Guard: Usuario verificado:', resolvedBackendUser);
            } catch (error: any) {
                console.log('❌ Guard: Error verificando usuario:', error);
                return handleBackendError(error, router);
            }

            // 3. Verificar estado de cuenta
            const estadoCuenta = resolvedBackendUser?.estado_cuenta || resolvedBackendUser?.estado;

            if (estadoCuenta === 'Pendiente') {
                console.log('⏳ Guard: Usuario pendiente de aprobación');
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Pendiente' } });
            }

            if (estadoCuenta === 'Bloqueada') {
                console.log('🚫 Guard: Usuario bloqueado');
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Bloqueada' } });
            }

            if (estadoCuenta === 'Rechazada') {
                console.log('❌ Guard: Usuario rechazado');
                return router.createUrlTree(['/auth/status'], { queryParams: { state: 'Rechazada' } });
            }

            // 4. Verificar rol si se requiere
            if (requiredRoles.length > 0 && !roleMatches(requiredRoles, resolvedBackendUser?.rol)) {
                console.log('🚫 Guard: Rol no autorizado');
                return router.createUrlTree(['/auth/access-denied']);
            }

            console.log('✅ Guard: Acceso permitido');
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
