import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const backendUser = authService.getBackendUserSnapshot();

    // Clonar request para añadir header X-User-Id si existe usuario
    if (backendUser?.id_usuario) {
        req = req.clone({
            setHeaders: {
                'X-User-Id': backendUser.id_usuario.toString()
            }
        });
    }

    return next(req);
};
