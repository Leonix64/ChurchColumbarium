import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { NotificationService } from "../services/notification.service";

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const notificationService = inject(NotificationService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'Ocurrio un error inesperado';

            if (error.error instanceof ErrorEvent) {
                // Error del cliente
                errorMessage = `Error: ${error.error.message}`;
            } else {
                // Error del servidor
                switch (error.status) {
                    case 401:
                        errorMessage = 'No autorizado. Por favor, inicie sesión';
                        router.navigate(['/auth/login']);
                        break;
                    case 403:
                        errorMessage = 'No tienes permisos para esta accion';
                        break;
                    case 404:
                        errorMessage = error.error?.message || 'Recurso no encontrado';
                        break;
                    case 409:
                        errorMessage = error.error?.message || 'El recurso ya existe';
                        break;
                    case 500:
                        errorMessage = 'Error del servidor. Intenta mas tarde';
                        break;
                    default:
                        errorMessage = error.error?.message || errorMessage;
                }
            }

            notificationService.error(errorMessage);
            return throwError(() => error);
        })
    );
};
