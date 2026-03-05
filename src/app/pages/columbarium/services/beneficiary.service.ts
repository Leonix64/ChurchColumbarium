import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import {
  BeneficiaryRecord,
  BeneficiaryInput
} from '../models/beneficiary.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BeneficiaryService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/beneficiaries`;

  getByNiche(nicheId: string):
    Observable<ApiResponse<BeneficiaryRecord[]>> {
    return this.http.get<ApiResponse<BeneficiaryRecord[]>>(
      `${this.api}/niche/${nicheId}`
    );
  }

  getNextBeneficiary(nicheId: string):
    Observable<ApiResponse<BeneficiaryRecord | null>> {
    return this.http.get<ApiResponse<BeneficiaryRecord | null>>(
      `${this.api}/niche/${nicheId}/next`
    );
  }

  create(nicheId: string, data: BeneficiaryInput):
    Observable<ApiResponse<BeneficiaryRecord>> {
    return this.http.post<ApiResponse<BeneficiaryRecord>>(
      `${this.api}/niche/${nicheId}`,
      data
    );
  }

  bulkUpdate(nicheId: string, beneficiaries: BeneficiaryInput[]):
    Observable<ApiResponse<BeneficiaryRecord[]>> {
    return this.http.put<ApiResponse<BeneficiaryRecord[]>>(
      `${this.api}/niche/${nicheId}/bulk`,
      { beneficiaries }
    );
  }

  // Alias para compatibilidad con código existente
  updateByNiche(
    nicheId: string,
    beneficiaries: BeneficiaryInput[]
  ): Observable<ApiResponse<BeneficiaryRecord[]>> {
    return this.bulkUpdate(nicheId, beneficiaries);
  }

  update(id: string, data: Partial<BeneficiaryInput>):
    Observable<ApiResponse<BeneficiaryRecord>> {
    return this.http.put<ApiResponse<BeneficiaryRecord>>(
      `${this.api}/${id}`,
      data
    );
  }

  markDeceased(
    id: string,
    deceasedDate: string,
    notes?: string
  ): Observable<ApiResponse<BeneficiaryRecord>> {
    return this.http.post<ApiResponse<BeneficiaryRecord>>(
      `${this.api}/${id}/deceased`,
      { deceasedDate, notes }
    );
  }
}
