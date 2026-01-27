import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';

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

  // Control de refresh para evitar llamadas múltiples
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

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
      //console.log('Sesión restaurada:', user.username);
    }
  }

  // Login
  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          const { user, tokens } = response.data;
          this.saveAuthData(tokens.accessToken, tokens.refreshToken, user);
          //console.log('Login exitoso:', user.username);
        }
      }),
      catchError(error => {
        //console.error('Error en login:', error);
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

    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  // Guardar datos de autenticación
  private saveAuthData(accessToken: string, refreshToken: string, user: User): void {
    this.storageService.set('accessToken', accessToken);
    this.storageService.set('refreshToken', refreshToken);
    this.storageService.set('user', user);

    this.tokenSignal.set(accessToken);
    this.currentUserSignal.set(user);
  }

  // Limpiar datos de autenticacion
  private clearAuthData(): void {
    this.storageService.remove('accessToken');
    this.storageService.remove('refreshToken');
    this.storageService.remove('user');

    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);

    //console.log('Datos de sesión limpiados');
  }

  // Renovar token (con protección contra llamadas múltiples)
  refreshToken(): Observable<any> {
    // Si ya está en progreso, esperar a que termine
    if (this.refreshTokenInProgress) {
      //console.log('Refresh ya en progreso, esperando...');
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap((token) => {
          return new Observable(observer => {
            observer.next(token);
            observer.complete();
          });
        })
      );
    }

    const refreshToken = this.storageService.get<string>('refreshToken');

    if (!refreshToken) {
      console.error('No hay refresh token disponible');
      this.clearAuthData();
      this.router.navigate(['/auth/login']);
      return throwError(() => new Error('No hay refresh token'));
    }

    this.refreshTokenInProgress = true;
    //console.log('Renovando token...');

    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        if (response.success && response.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Actualizar solo los tokens, mantener usuario
          this.storageService.set('accessToken', accessToken);
          this.storageService.set('refreshToken', newRefreshToken);
          this.tokenSignal.set(accessToken);

          this.refreshTokenInProgress = false;
          this.refreshTokenSubject.next(accessToken);

          //console.log('Token renovado exitosamente');
        }
      }),
      catchError(error => {
        //console.error('Error al renovar token:', error);
        this.refreshTokenInProgress = false;
        this.refreshTokenSubject.next(null);
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
          //console.log('Perfil actualizado:', response.data.username);
        }
      }),
      catchError(error => {
        //console.error('Error al obtener perfil:', error);
        return throwError(() => error);
      })
    );
  }
}
