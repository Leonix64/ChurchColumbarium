import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, switchMap, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.token();

    // Si hay token, agregarlo al header
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Si es 401 y NO es la ruta de refresh, intentar renovar
            if (error.status === 401 && !req.url.includes('/auth/refresh-token')) {
                //console.log('Token expirado, intentando renovar...');

                return authService.refreshToken().pipe(
                    switchMap(() => {
                        // Reintentar la petición original con el nuevo token
                        const newToken = authService.token();
                        const clonedReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });

                        //console.log('Token renovado, reintentando petición');
                        return next(clonedReq);
                    }),
                    catchError((refreshError) => {
                        // Si falla el refresh, dejar que el error interceptor maneje
                        //console.error('Error al renovar token:', refreshError);
                        return throwError(() => error);
                    })
                );
            }

            return throwError(() => error);
        })
    );
}
