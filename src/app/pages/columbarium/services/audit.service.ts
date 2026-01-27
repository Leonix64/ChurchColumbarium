import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuditLog, AuditFilters } from '../models/audit.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly endpoint = `${environment.apiUrl}/audit`;

  // Estado reactivo
  private logsSignal = signal<AuditLog[]>([]);
  logs = this.logsSignal.asReadonly();

  constructor(private http: HttpClient) { }

  // Obtener logs con filtros
  getAll(params?: AuditFilters & { limit?: number; page?: number }): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(this.endpoint, { params: params as any }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.logsSignal.set(response.data);
        }
      })
    );
  }

  // Obtener logs de una entidad específica
  getByEntity(entity: string, entityId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.endpoint}/entity/${entity}/${entityId}`);
  }

  // Obtener logs de un usuario
  getByUser(userId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.endpoint}/user/${userId}`);
  }

  // Helpers
  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      'create': 'Creó',
      'update': 'Actualizó',
      'delete': 'Eliminó',
      'login': 'Inició sesión',
      'logout': 'Cerró sesión',
      'payment': 'Registró pago',
      'cancel': 'Canceló',
      'disable': 'Deshabilitó',
      'enable': 'Habilitó'
    };
    return labels[action] || action;
  }

  getEntityLabel(entity: string): string {
    const labels: { [key: string]: string } = {
      'customer': 'Cliente',
      'niche': 'Nicho',
      'sale': 'Venta',
      'payment': 'Pago',
      'user': 'Usuario'
    };
    return labels[entity] || entity;
  }

  getActionColor(action: string): string {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'primary';
      case 'delete':
      case 'cancel':
        return 'danger';
      case 'payment':
        return 'success';
      case 'disable':
        return 'warning';
      case 'enable':
        return 'success';
      case 'login':
      case 'logout':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'create':
        return 'add-circle-outline';
      case 'update':
        return 'create-outline';
      case 'delete':
        return 'trash-outline';
      case 'login':
        return 'log-in-outline';
      case 'logout':
        return 'log-out-outline';
      case 'payment':
        return 'cash-outline';
      case 'cancel':
        return 'close-circle-outline';
      case 'disable':
        return 'ban-outline';
      case 'enable':
        return 'checkmark-circle-outline';
      default:
        return 'document-text-outline';
    }
  }
}