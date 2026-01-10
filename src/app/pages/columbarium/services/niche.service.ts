import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Niche, ModuleGroup, SectionGroup, NicheStats } from '../models/niche.model';
import { ApiResponse } from 'src/app/core/models/api-response.model';

// Nombres descriptivos de módulos
const MODULE_NAMES: { [key: string]: string } = {
  'A': 'Resurrección',
  'B': 'Mármol Especial',
  'C': 'Virgen del Perpetuo Socorro',
  'D': 'Virgen del Rosario',
  'E': 'Nuestra Señora del Refugio',
  'F': 'Virgen de Guadalupe',
  'G': 'Virgen de Fátima',
  'H': 'San Juan de los Lagos'
};

@Injectable({
  providedIn: 'root',
})
export class NicheService {
  private readonly endpoint = `${environment.apiUrl}/niches`;

  // Estado reactivo
  private nichesSignal = signal<Niche[]>([]);
  niches = this.nichesSignal.asReadonly();

  // Computed: agrupar por modulos
  moduleGroups = computed(() => this.groupByModules(this.niches()));

  // Computed: stats generales
  stats = computed(() => this.calculateStats(this.niches()));

  constructor(private http: HttpClient) { }

  getAll(params?: {
    module?: string;
    section?: string;
    status?: string;
    type?: string;
  }): Observable<ApiResponse<Niche[]>> {
    return this.http.get<ApiResponse<Niche[]>>(this.endpoint, { params: params as any }).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.nichesSignal.set(response.data);
        }
      })
    );
  }

  getById(id: string): Observable<ApiResponse<Niche>> {
    return this.http.get<ApiResponse<Niche>>(`${this.endpoint}/${id}`);
  }

  getByCode(code: string): Observable<ApiResponse<Niche>> {
    return this.http.get<ApiResponse<Niche>>(`${this.endpoint}/code/${code}`);
  }

  getAvailable(params?: {
    type?: string;
    module?: string;
    section?: string;
  }): Observable<ApiResponse<Niche[]>> {
    return this.http.get<ApiResponse<Niche[]>>(`${this.endpoint}/available`, { params: params as any });
  }

  getStats(): Observable<ApiResponse<NicheStats>> {
    return this.http.get<ApiResponse<NicheStats>>(`${this.endpoint}/stats`);
  }

  updateStatus(id: string, status: string, notes?: string): Observable<ApiResponse<Niche>> {
    return this.http.put<ApiResponse<Niche>>(`${this.endpoint}/${id}`, { status, notes }).pipe(
      tap(() => this.getAll().subscribe())
    );
  }

  // === Agrupacion ===

  private groupByModules(niches: Niche[]): ModuleGroup[] {
    if (!niches || niches.length === 0) return [];

    const grouped = new Map<string, Niche[]>();

    niches.forEach(niche => {
      const key = niche.module;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(niche);
    });

    const modules: ModuleGroup[] = [];

    grouped.forEach((moduleNiches, module) => {
      const sections = this.groupBySections(moduleNiches);

      const totalNiches = moduleNiches.length;
      const availableNiches = moduleNiches.filter(n => n.status === 'available').length;
      const soldNiches = moduleNiches.filter(n => n.status === 'sold').length;
      const reservedNiches = moduleNiches.filter(n => n.status === 'reserved').length;

      modules.push({
        module,
        moduleName: MODULE_NAMES[module] || `Modulo ${module}`,
        sections,
        totalNiches,
        availableNiches,
        soldNiches,
        reservedNiches
      });
    });

    return modules.sort((a, b) => a.module.localeCompare(b.module));
  }

  private groupBySections(niches: Niche[]): SectionGroup[] {
    const grouped = new Map<string, Niche[]>();

    niches.forEach(niche => {
      const key = niche.section;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(niche);
    });

    const sections: SectionGroup[] = [];

    grouped.forEach((sectionNiches, section) => {
      const sortedNiches = sectionNiches.sort((a, b) => a.displayNumber - b.displayNumber);

      const rows = Math.max(...sortedNiches.map(n => n.row));
      const nichesPerRow = Math.max(...sortedNiches.map(n => n.number));

      sections.push({
        section,
        niches: sortedNiches,
        totalNiches: sortedNiches.length,
        availableNiches: sortedNiches.filter(n => n.status === 'available').length,
        soldNiches: sortedNiches.filter(n => n.status === 'sold').length,
        reservedNiches: sortedNiches.filter(n => n.status === 'reserved').length,
        rows,
        nichesPerRow
      });
    });

    return sections.sort((a, b) => a.section.localeCompare(b.section));
  }

  private calculateStats(niches: Niche[]): NicheStats {
    const stats: NicheStats = {
      total: niches.length,
      available: 0,
      sold: 0,
      reserved: 0,
      disabled: 0,
      byModule: {},
      byType: { wood: 0, marble: 0, special: 0 }
    };

    niches.forEach(niche => {
      // Por estado
      switch (niche.status) {
        case 'available':
          stats.available++;
          break;
        case 'sold':
          stats.sold++;
          break;
        case 'reserved':
          stats.reserved++;
          break;
        case 'disabled':
          stats.disabled++;
          break;
      }

      // Por modulo
      stats.byModule[niche.module] = (stats.byModule[niche.module] || 0) + 1;

      // Por tipo
      if (niche.type === 'wood') stats.byType.wood++;
      else if (niche.type === 'marble') stats.byType.marble++;
      else if (niche.type === 'special') stats.byType.special++;
    });

    return stats;
  }

  // === Helpers ===

  getModuleName(module: string): string {
    return MODULE_NAMES[module] || `Modulo ${module}`;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'success';
      case 'sold':
        return 'danger';
      case 'reserved':
        return 'warning';
      case 'disabled':
        return 'medium';
      default:
        return 'medium';
    }
  }

  getTypeIcon(type: string): string {
    // Puede que despues meta emojis en return
    switch (type) {
      case 'wood':
        return 'wood';
      case 'marble':
        return 'marble';
      case 'special':
        return 'special';
      default:
        return 'wood';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'sold':
        return 'Vendido';
      case 'reserved':
        return 'Reservado';
      case 'disabled':
        return 'Deshabilitado';
      default:
        return status;
    }
  }
}
