import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

import { environment } from 'src/environments/environment.prod';
import { StorageService } from './storage.service';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root',
})
export class AuthService {

  // Estado reactivo con Signals
  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);

  // Propiedades publicas
  currentUser = this.currentUserSignal.asReadonly();
  token = this.tokenSignal.asReadonly();

  // Computed: se calcula automaticamente
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === 'admin');
  isSeller = computed(() => this.currentUserSignal()?.role === 'seller');

  constructor(
    private http: HttpClient,
    private router: Router,
    private storageService: StorageService
  ) {
    this.loadStoredAuth();
  }

  // Cargar datos guardados (si existe sesion previa)
  private loadStoredAuth(): void {
    const token = this.storageService.get<string>('accessToken');
    const user = this.storageService.get<User>('user');

    if (token && user) {
      this.tokenSignal.set(token);
      this.currentUserSignal.set(user);
    }
  }

  // Login
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Guardar token y usuario
          const { user, tokens } = response.data;

          this.storageService.set('accessToken', tokens.accessToken);
          this.storageService.set('refreshToken', tokens.refreshToken);
          this.storageService.set('user', user);

          // Actualizar signals
          this.tokenSignal.set(tokens.accessToken);
          this.currentUserSignal.set(user);

          console.log('Login exitoso:', user.username);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  // Logout
  logout(): void {
    const refreshToken = this.storageService.get<string>('refreshToken');

    // Llamar al backend para invalidar token
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe({
        next: () => console.log('Logout en backend exitoso'),
        error: (err) => console.error('Error al hacer logout en backend:', err)
      });
    }

    // Limpiar storage y estado local
    this.clearAuthData();

    // Redirigir al login
    this.router.navigate(['/auth/login']);
  }

  // Limpiar datos de autenticacion
  private clearAuthData(): void {
    this.storageService.remove('accessToken');
    this.storageService.remove('refreshToken');
    this.storageService.remove('user');

    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);

    console.log('Datos de sesion limpiados');
  }

  // Renovar token (Refresh Token)
  refreshToken(): Observable<any> {
    const refreshToken = this.storageService.get<string>('refreshToken');

    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token'));
    }

    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storageService.set('accessToken', response.data.accessToken);
          this.storageService.set('refreshToken', response.data.refreshToken);
          this.tokenSignal.set(response.data.accessToken);
        }
      }),
      catchError(error => {
        console.error('Error al renovar token:', error);
        this.clearAuthData();
        this.router.navigate(['/auth/login']);
        return throwError(() => error);
      })
    );
  }

  // Obtener perfil del usuario actual
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/profile`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storageService.set('user', response.data);
          this.currentUserSignal.set(response.data);
        }
      })
    );
  }
}
