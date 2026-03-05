import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { Sale, SalesStats, AmortizationEntry } from '../models/sale.model';
import {
  CreateSaleRequest,
  RegisterPaymentRequest,
  CancelSaleRequest
} from '../models/sale.requests';
import { ApiResponse } from 'src/app/core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private readonly endpoint = `${environment.apiUrl}/sales`;

  // Estado reactivo
  private salesSignal = signal<Sale[]>([]);
  sales = this.salesSignal.asReadonly();

  constructor(private http: HttpClient) { }

  // Obtener todas las ventas
  getAll(params?: { status?: string; customerId?: string; }): Observable<ApiResponse<Sale[]>> {
    return this.http.get<ApiResponse<Sale[]>>(this.endpoint, { params: params as any }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.salesSignal.set(response.data);
        }
      })
    );
  }

  // Obtener venta por ID
  getById(id: string): Observable<ApiResponse<Sale>> {
    return this.http.get<ApiResponse<Sale>>(`${this.endpoint}/${id}`);
  }

  // Crear nueva venta
  create(saleData: CreateSaleRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.endpoint, saleData).pipe(
      tap(() => this.getAll().subscribe())
    );
  }

  // Registrar pago con modo flexible
  registerPayment(saleId: string, paymentData: RegisterPaymentRequest): Observable<ApiResponse<any>> {
    console.log('Enviando pago al backend:', paymentData);

    return this.http.post<ApiResponse<any>>(`${this.endpoint}/${saleId}/payment`, paymentData).pipe(
      tap((response) => {
        console.log('Respuesta del backend:', response);
        // Actualizar la venta especifica
        this.getById(saleId).subscribe();
        // Actualizar lista completa
        this.getAll().subscribe();
      })
    );
  }

  // Cancelar venta
  cancelSale(saleId: string, cancelData: CancelSaleRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.endpoint}/${saleId}/cancel`, cancelData).pipe(
      tap(() => {
        // Actualizar listas
        this.getById(saleId).subscribe();
        this.getAll().subscribe();
      })
    );
  }

  // Obtener estadísticas de ventas
  getStats(): Observable<ApiResponse<SalesStats>> {
    return this.http.get<ApiResponse<SalesStats>>(`${this.endpoint}/stats`);
  }

  // Calcular mensualidad (cliente)
  calculateMonthly(total: number, downPayment: number, months: number = 18): number {
    const balance = total - downPayment;
    return Number((balance / months).toFixed(2));
  }

  // Validar monto de enganche
  isValidDownPayment(downPayment: number, total: number): boolean {
    return downPayment > 0 && downPayment < total;
  }

  // Colores de estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'warning';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'overdue':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Labels de estado
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'paid':
        return 'Pagada';
      case 'cancelled':
        return 'Cancelada';
      case 'overdue':
        return 'Vencida';
      default:
        return status;
    }
  }

  // Colores de estado de pago
  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partial':
        return 'warning';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Labels de estado de pago
  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'partial':
        return 'Parcial';
      case 'paid':
        return 'Pagado';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  }

  // Calcular progreso de pago
  calculateProgress(schedule: AmortizationEntry[]): number {
    if (!schedule || schedule.length === 0) return 0;

    const total = schedule.length;
    const paid = schedule.filter(p => p.status === 'paid').length;

    return Math.round((paid / total) * 100);
  }

  // Calcular total pagado desde schedule
  calculateTotalPaid(schedule: AmortizationEntry[]): number {
    if (!schedule || schedule.length === 0) return 0;

    return schedule.reduce((total, payment) => {
      return total + (payment.amountPaid || 0);
    }, 0);
  }
}
