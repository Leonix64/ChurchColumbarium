import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Customer } from '../models/customer.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { Sale } from '../models/sale.model';
import { MaintenancePayment } from '../models/maintenance.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private readonly endpoint = `${environment.apiUrl}/maintenance`;

  // Estado reactivo
  private maintenanceSignal = signal<MaintenancePayment[]>([]);
  maintenance = this.maintenanceSignal.asReadonly();

  constructor(private http: HttpClient) { }

  registerMaintenance(customerId: string, data: {
    amount: number;
    method: 'cash' | 'card' | 'transfer';
    year: number;
    notes?: string;
  }): Observable<ApiResponse<MaintenancePayment>> {
    return this.http.post<ApiResponse<MaintenancePayment>>(`${this.endpoint}/${customerId}/maintenance`, data);
  }

  getMaintenancePayments(customerId: string): Observable<ApiResponse<MaintenancePayment[]>> {
    return this.http.get<ApiResponse<MaintenancePayment[]>>(`${this.endpoint}/${customerId}/maintenance`);
  }
}
