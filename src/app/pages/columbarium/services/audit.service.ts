import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { AuditLog, AuditFilters, AuditStats } from '../models/audit.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly endpoint = `${environment.apiUrl}/audit`;

  // Estado reactivo
  private logsSignal = signal<AuditLog[]>([]);
  logs = this.logsSignal.asReadonly();

  private statsSignal = signal<AuditStats | null>(null);
  stats = this.statsSignal.asReadonly();

  constructor(private http: HttpClient) { }

  // ═══════ ENDPOINTS ═══════

  // GET /api/audit — listar logs con filtros y paginación
  getAll(params?: AuditFilters & { limit?: number; page?: number }): Observable<any> {
    const options = params ? { params: params as any } : {};
    return this.http.get<any>(this.endpoint, options).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.logsSignal.set(response.data);
        }
      })
    );
  }

  // GET /api/audit/stats — estadísticas completas
  getStats(params?: { startDate?: string; endDate?: string }): Observable<ApiResponse<AuditStats>> {
    const options = params ? { params: params as any } : {};
    return this.http.get<ApiResponse<AuditStats>>(`${this.endpoint}/stats`, options).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.statsSignal.set(response.data);
        }
      })
    );
  }

  // GET /api/audit/recent — actividad reciente
  getRecent(limit: number = 20): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.endpoint}/recent`, {
      params: { limit: limit.toString() }
    });
  }

  // GET /api/audit/resource/:resourceId — historial de recurso
  getResourceHistory(resourceId: string): Observable<ApiResponse<AuditLog[]>> {
    return this.http.get<ApiResponse<AuditLog[]>>(`${this.endpoint}/resource/${resourceId}`);
  }

  // GET /api/audit/user/:userId — historial de usuario
  getUserHistory(userId: string, params?: { limit?: number; page?: number }): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/user/${userId}`, { params: params as any });
  }

  // DELETE /api/audit/cleanup — limpiar logs viejos
  cleanupOldLogs(daysOld: number): Observable<ApiResponse<any>> {
    return this.http.request<ApiResponse<any>>('DELETE', `${this.endpoint}/cleanup`, {
      body: { daysOld }
    });
  }

  // ═══════ HELPERS ═══════

  getActionLabel(action: string): string {
    const labels: { [key: string]: string } = {
      // Auth
      'login': 'Inició sesión',
      'logout': 'Cerró sesión',
      'register': 'Registro de usuario',
      'change_password': 'Cambió contraseña',
      // Clientes
      'create_customer': 'Creó cliente',
      'update_customer': 'Actualizó cliente',
      'delete_customer': 'Eliminó cliente',
      'update_beneficiaries': 'Actualizó beneficiarios',
      'mark_beneficiary_deceased': 'Marcó beneficiario fallecido',
      // Nichos
      'create_niche': 'Creó nicho',
      'update_niche': 'Actualizó nicho',
      'disable_niche': 'Deshabilitó nicho',
      'enable_niche': 'Habilitó nicho',
      'change_material': 'Cambió material',
      'bulk_change_material': 'Cambio masivo de material',
      'change_price': 'Cambió precio',
      // Ventas
      'create_sale': 'Creó venta',
      'register_payment': 'Registró pago',
      'create_bulk_sale': 'Venta masiva',
      'cancel_sale': 'Canceló venta',
      // Mantenimiento
      'register_maintenance': 'Mantenimiento',
      // Sucesión
      'register_succession': 'Registró sucesión',
      'manual_transfer': 'Transferencia manual'
    };
    return labels[action] || action;
  }

  getModuleLabel(mod: string): string {
    const labels: { [key: string]: string } = {
      'auth': 'Autenticación',
      'customer': 'Clientes',
      'niche': 'Nichos',
      'sale': 'Ventas',
      'payment': 'Pagos'
    };
    return labels[mod] || mod;
  }

  getModuleIcon(mod: string): string {
    const icons: { [key: string]: string } = {
      'auth': 'key-outline',
      'customer': 'people-outline',
      'niche': 'grid-outline',
      'sale': 'cart-outline',
      'payment': 'cash-outline'
    };
    return icons[mod] || 'document-text-outline';
  }

  getModuleColor(mod: string): string {
    const colors: { [key: string]: string } = {
      'auth': 'medium',
      'customer': 'primary',
      'niche': 'tertiary',
      'sale': 'success',
      'payment': 'warning'
    };
    return colors[mod] || 'medium';
  }

  getActionColor(action: string): string {
    if (action.startsWith('create') || action.startsWith('enable') || action === 'register_payment') {
      return 'success';
    }
    if (action.startsWith('update') || action.startsWith('change') || action.startsWith('bulk_change')) return 'primary';
    if (action.startsWith('delete') || action.startsWith('cancel')) return 'danger';
    if (action.startsWith('disable')) return 'warning';
    if (action === 'login' || action === 'logout' || action === 'register' || action === 'change_password') return 'medium';
    if (action === 'register_maintenance') return 'tertiary';
    if (action === 'register_succession' || action === 'manual_transfer') return 'primary';
    if (action === 'mark_beneficiary_deceased') return 'warning';
    return 'medium';
  }

  getActionIcon(action: string): string {
    if (action.startsWith('create')) return 'add-circle-outline';
    if (action.startsWith('update')) return 'create-outline';
    if (action.startsWith('delete')) return 'trash-outline';
    if (action.startsWith('cancel')) return 'close-circle-outline';
    if (action.startsWith('disable')) return 'ban-outline';
    if (action.startsWith('enable')) return 'checkmark-circle-outline';

    switch (action) {
      case 'login': return 'log-in-outline';
      case 'logout': return 'log-out-outline';
      case 'register': return 'person-add-outline';
      case 'change_password': return 'lock-closed-outline';
      case 'change_material': return 'construct-outline';
      case 'bulk_change_material': return 'layers-outline';
      case 'change_price': return 'pricetag-outline';
      case 'register_payment': return 'cash-outline';
      case 'register_maintenance': return 'build-outline';
      case 'register_succession': return 'swap-horizontal-outline';
      case 'manual_transfer': return 'swap-horizontal-outline';
      case 'mark_beneficiary_deceased': return 'alert-circle-outline';
      default: return 'document-text-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'success': return 'Exitoso';
      case 'error': return 'Error';
      case 'warning': return 'Advertencia';
      default: return status;
    }
  }
}
