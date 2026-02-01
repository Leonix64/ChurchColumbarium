import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { ApiResponse } from 'src/app/core/models/api-response.model';
import { OwnershipHistory } from '../models/beneficiary.model';
import { SuccessionRequest, SuccessionResponse, TransferRequest } from '../models/succession.model';

@Injectable({
  providedIn: 'root',
})
export class SuccessionService {
  private readonly endpoint = `${environment.apiUrl}/succession`;

  constructor(private http: HttpClient) { }


  // Registrar fallecimiento y sucesión automática

  registerSuccession(data: SuccessionRequest): Observable<ApiResponse<SuccessionResponse>> {
    return this.http.post<ApiResponse<SuccessionResponse>>(`${this.endpoint}/register`, data);
  }

  // Obtener historial de titularidad de un nicho
  getOwnershipHistory(nicheId: string): Observable<ApiResponse<{
    niche: any;
    currentOwner: any;
    history: OwnershipHistory[];
  }>> {
    return this.http.get<ApiResponse<any>>(`${this.endpoint}/niche/${nicheId}/history`);
  }

  // Transferencia manual de titularidad
  manualTransfer(data: TransferRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.endpoint}/transfer`, data);
  }
}