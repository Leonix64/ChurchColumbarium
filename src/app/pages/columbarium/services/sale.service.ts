import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

import { Sale, SalesStats, AmortizationEntry } from '../models/sale.model';
import { Payment } from '../models/payment.model';
import { CreateSaleRequest, CreateBulkSaleRequest, RegisterPaymentRequest } from '../models/sale.requests';
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

  // Crear venta multiple
  createBulk(bulkData: CreateBulkSaleRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.endpoint}/bulk`, bulkData).pipe(
      tap(() => this.getAll().subscribe())
    );
  }

  // Registrar pago mensual
  registerPayment(saleId: string, paymentData: RegisterPaymentRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.endpoint}/${saleId}/payment`, paymentData).pipe(
      tap(() => {
        // Actualizar la venta especifica
        this.getById(saleId).subscribe();
        // Actualizar lista completa
        this.getAll().subscribe();
      })
    );
  }

  // Obtener estadisticas de ventas
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

  // obtener color de badge segun estado
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'warning';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Obtener label segun estado
  getStatusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'paid':
        return 'Pagado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  // Obtener color de badge segun metodo de pago
  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Obtener label segun estado de pago
  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'paid':
        return 'Pagado';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  }

  // Calcular progreso de pago
  calculateProgress(amortizationTable: any[]): number {
    const total = amortizationTable.length;
    const paid = amortizationTable.filter(p => p.status === 'paid').length;
    return Math.round((paid / total) * 100);
  }
}
