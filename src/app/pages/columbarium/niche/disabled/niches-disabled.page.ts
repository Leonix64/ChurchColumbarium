import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonSearchbar,
  IonButton, IonIcon, IonSpinner, IonBadge,
  IonList, IonItem, IonNote, IonCheckbox,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  banOutline, checkmarkCircleOutline, timeOutline,
  personOutline, alertCircleOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Niche } from '../../models/niche.model';

@Component({
  selector: 'app-niches-disabled',
  templateUrl: './niches-disabled.page.html',
  styleUrls: ['./niches-disabled.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonSearchbar,
    IonButton, IonIcon, IonSpinner, IonBadge,
    IonList, IonItem, IonNote, IonCheckbox,
    IonRefresher, IonRefresherContent,
    HeaderComponent, EmptyStateComponent
  ]
})
export class NichesDisabledPage implements OnInit {
  loading = signal(true);
  disabledNiches = signal<Niche[]>([]);
  selectedIds = signal<Set<string>>(new Set());
  searchTerm = signal('');
  enabling = signal(false);

  filteredNiches = computed(() => {
    const search = this.searchTerm().toLowerCase();
    let result = this.disabledNiches();
    if (search) {
      result = result.filter(n =>
        n.code.toLowerCase().includes(search) ||
        (n.disabledReason || '').toLowerCase().includes(search) ||
        this.nicheService.getModuleName(n.module).toLowerCase().includes(search)
      );
    }
    return result;
  });

  allSelected = computed(() => {
    const filtered = this.filteredNiches();
    return filtered.length > 0 && filtered.every(n => this.selectedIds().has(n._id));
  });

  selectedCount = computed(() => this.selectedIds().size);

  constructor(
    public nicheService: NicheService,
    private notificationService: NotificationService
  ) {
    addIcons({
      banOutline, checkmarkCircleOutline, timeOutline,
      personOutline, alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadDisabled();
  }

  loadDisabled() {
    this.loading.set(true);
    this.nicheService.getDisabledNiches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.disabledNiches.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar nichos deshabilitados');
      }
    });
  }

  doRefresh(event: any) {
    this.nicheService.getDisabledNiches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.disabledNiches.set(response.data);
        }
        event.target.complete();
      },
      error: () => event.target.complete()
    });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target?.value || '');
  }

  toggleSelection(nicheId: string) {
    const current = new Set(this.selectedIds());
    if (current.has(nicheId)) {
      current.delete(nicheId);
    } else {
      current.add(nicheId);
    }
    this.selectedIds.set(current);
  }

  toggleAll() {
    const filtered = this.filteredNiches();
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(filtered.map(n => n._id)));
    }
  }

  isSelected(nicheId: string): boolean {
    return this.selectedIds().has(nicheId);
  }

  async enableSelected() {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      this.notificationService.error('Selecciona al menos un nicho');
      return;
    }

    const confirmed = await this.notificationService.confirm(
      'Habilitar Nichos',
      `¿Habilitar ${ids.length} nicho(s)?`
    );

    if (!confirmed) return;

    this.enabling.set(true);

    this.nicheService.enableNiches(ids).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || `${ids.length} nicho(s) habilitado(s)`);
          this.selectedIds.set(new Set());
          this.loadDisabled();
        }
        this.enabling.set(false);
      },
      error: (err) => {
        this.notificationService.error(err.error?.message || 'Error al habilitar nichos');
        this.enabling.set(false);
      }
    });
  }

  getDaysDisabled(disabledAt: Date | undefined): number {
    if (!disabledAt) return 0;
    const now = new Date();
    const disabled = new Date(disabledAt);
    return Math.floor((now.getTime() - disabled.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDisabledByName(niche: Niche): string {
    if (!niche.disabledBy) return 'Sistema';
    if (typeof niche.disabledBy === 'object' && (niche.disabledBy as any).fullName) {
      return (niche.disabledBy as any).fullName;
    }
    return 'Admin';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
