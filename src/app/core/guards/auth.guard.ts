import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Si esta autenticado, permite pasar
    if (authService.isAuthenticated()) {
        return true;
    }

    // Si no, redirige a login
    console.warn('Acceso denegado: no autenticado');
    router.navigate(['/auth/login']);
    return false;
};