import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Customer } from '../models/customer.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private readonly endpoint = `${environment.apiUrl}/customers`;

  // Estado reactivo
  private customersSignal = signal<Customer[]>([]);
  customers = this.customersSignal.asReadonly();

  constructor(private http: HttpClient) { }

  getAll(params?: { search?: string; active?: boolean }): Observable<ApiResponse<Customer[]>> {
    return this.http.get<ApiResponse<Customer[]>>(this.endpoint, { params: params as any })
      .pipe(tap(response => {
        if (response.success && response.data) {
          this.customersSignal.set(response.data);
        }
      }
      ));
  }

  getById(id: string): Observable<ApiResponse<Customer>> {
    return this.http.get<ApiResponse<Customer>>(`${this.endpoint}/${id}`);
  }

  create(customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(this.endpoint, customer)
      .pipe(tap(() => this.getAll().subscribe())); // Refresh list
  }

  update(id: string, customer: Partial<Customer>): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.endpoint}/${id}`, customer)
      .pipe(tap(() => this.getAll().subscribe()));
  }

  deactivate(id: string): Observable<ApiResponse<Customer>> {
    return this.http.delete<ApiResponse<Customer>>(`${this.endpoint}/${id}`)
      .pipe(tap(() => this.getAll().subscribe()));
  }

  activate(id: string): Observable<ApiResponse<Customer>> {
    return this.http.patch<ApiResponse<Customer>>(`${this.endpoint}/${id}/activate`, {})
      .pipe(tap(() => this.getAll().subscribe()));
  }
}
