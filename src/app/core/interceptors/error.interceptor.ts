import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ocurrió un error inesperado';

            // Ignorar errores auth 404 (usuario no registrado) si estamos en login
            if (error.status === 404 && req.url.includes('/auth/login')) {
                return throwError(() => error);
            }

            if (error.error instanceof ErrorEvent) {
                // Error de cliente
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Error de servidor
                if (error.status === 401) {
                    errorMessage = 'Sesión expirada o no autorizada';
                    // Opcional: router.navigate(['/auth/login']);
                } else if (error.status === 403) {
                    errorMessage = 'No tienes permisos para realizar esta acción';
                } else if (error.status === 404) {
                    errorMessage = 'Recurso no encontrado';
                } else if (error.status >= 500) {
                    errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
                } else {
                    errorMessage = error.error?.mensaje || error.error?.error || `Error ${error.status}: ${error.statusText}`;
                }
            }

            // Mostrar toast solo para errores relevantes (evitar spam si se manejan localmente)
            // Por defecto mostramos todo excepto 404 (que a veces es esperado)
            if (error.status !== 404 || req.method !== 'GET') {
                toastService.error(errorMessage);
            }

            console.error('❌ Interceptor Error:', error);
            return throwError(() => error);
        })
    );
};
