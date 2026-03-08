import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonSearchbar,
  IonButton, IonIcon, IonSpinner, IonBadge,
  IonList, IonItem, IonSelect, IonSelectOption,
  IonCheckbox, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  ModalController, AlertController, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline, cashOutline, buildOutline, banOutline,
  checkmarkCircleOutline, searchOutline, createOutline,
  filterOutline, refreshOutline, ellipsisVerticalOutline,
  pricetagOutline, gridOutline, addCircleOutline,
  colorPaletteOutline, listOutline, chevronBackOutline,
  chevronForwardOutline, helpCircleOutline, arrowForwardOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { NichePriceModalComponent } from '../../components/niche-price-modal/niche-price-modal.component';
import { NicheMaterialModalComponent } from '../../components/niche-material-modal/niche-material-modal.component';
import { BulkMaterialModalComponent } from '../../components/bulk-material-modal/bulk-material-modal.component';
import { NicheCreateModalComponent } from '../../components/niche-create-modal/niche-create-modal.component';
import { Niche } from '../../models/niche.model';

@Component({
  selector: 'app-niches-manage',
  templateUrl: './niches-manage.page.html',
  styleUrls: ['./niches-manage.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonSearchbar,
    IonButton, IonIcon, IonSpinner, IonBadge,
    IonList, IonItem, IonSelect, IonSelectOption,
    IonCheckbox, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonRefresher, IonRefresherContent,
    HeaderComponent, EmptyStateComponent, StatusBadgeComponent, CurrencyMxPipe
  ]
})
export class NichesManagePage implements OnInit {
  loading = signal(true);
  searchTerm = signal('');
  statusFilter = signal<string>('all');
  typeFilter = signal<string>('all');
  moduleFilter = signal<string>('all');

  // Paginación
  currentPage = signal(1);
  pageSize = signal(50);

  // Selección múltiple
  selectionMode = signal(false);
  selectedIds = signal<Set<string>>(new Set());

  niches = this.nicheService.niches;
  stats = this.nicheService.stats;

  // Filtros computados (sin paginar)
  allFilteredNiches = computed(() => {
    let result = this.niches();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(n =>
        n.code.toLowerCase().includes(search) ||
        n.displayNumber?.toString().includes(search) ||
        this.nicheService.getModuleName(n.module).toLowerCase().includes(search)
      );
    }

    const status = this.statusFilter();
    if (status !== 'all') {
      result = result.filter(n => n.status === status);
    }

    const type = this.typeFilter();
    if (type !== 'all') {
      result = result.filter(n => n.type === type);
    }

    const mod = this.moduleFilter();
    if (mod !== 'all') {
      result = result.filter(n => n.module === mod);
    }

    return result;
  });

  totalFiltered = computed(() => this.allFilteredNiches().length);
  totalPages = computed(() => Math.ceil(this.totalFiltered() / this.pageSize()) || 1);

  // Nichos de la página actual
  filteredNiches = computed(() => {
    const all = this.allFilteredNiches();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return all.slice(start, end);
  });

  // Rango de la página actual para mostrar
  pageRangeStart = computed(() => {
    if (this.totalFiltered() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  pageRangeEnd = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalFiltered());
  });

  selectedCount = computed(() => this.selectedIds().size);

  selectedNiches = computed(() => {
    const ids = this.selectedIds();
    return this.allFilteredNiches().filter(n => ids.has(n._id));
  });

  allSelected = computed(() => {
    const page = this.filteredNiches();
    return page.length > 0 && page.every(n => this.selectedIds().has(n._id));
  });

  availableModules = computed(() => {
    const modules = new Set(this.niches().map(n => n.module));
    return Array.from(modules).sort();
  });

  constructor(
    public nicheService: NicheService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private router: Router
  ) {
    addIcons({
      cubeOutline, cashOutline, buildOutline, banOutline,
      checkmarkCircleOutline, searchOutline, createOutline,
      filterOutline, refreshOutline, ellipsisVerticalOutline,
      pricetagOutline, gridOutline, addCircleOutline,
      colorPaletteOutline, listOutline, chevronBackOutline,
      chevronForwardOutline, helpCircleOutline, arrowForwardOutline
    });
  }

  ngOnInit() {
    this.loadNiches();
  }

  loadNiches() {
    this.loading.set(true);
    this.nicheService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar nichos');
      }
    });
  }

  doRefresh(event: any) {
    this.nicheService.getAll().subscribe({
      next: () => event.target.complete(),
      error: () => event.target.complete()
    });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target?.value || '');
    this.currentPage.set(1);
  }

  onStatusFilter(event: any) {
    this.statusFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
  }

  onTypeFilter(event: any) {
    this.typeFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
  }

  onModuleFilter(event: any) {
    this.moduleFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
  }

  // === Paginación ===
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  // === Selección múltiple ===

  toggleSelectionMode() {
    this.selectionMode.set(!this.selectionMode());
    if (!this.selectionMode()) {
      this.selectedIds.set(new Set());
    }
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
    const page = this.filteredNiches();
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const current = new Set(this.selectedIds());
      page.forEach(n => current.add(n._id));
      this.selectedIds.set(current);
    }
  }

  isSelected(nicheId: string): boolean {
    return this.selectedIds().has(nicheId);
  }

  // === Modales ===

  openDetail(niche: Niche) {
    if (this.selectionMode()) {
      this.toggleSelection(niche._id);
      return;
    }
    this.router.navigate(['/columbarium/niches', niche._id]);
  }

  async openPriceModal(niche: Niche) {
    const modal = await this.modalCtrl.create({
      component: NichePriceModalComponent,
      componentProps: { niche },
      cssClass: 'price-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.notificationService.success(`Precio actualizado a ${data.newPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);
      this.loadNiches();
    }
  }

  async openMaterialModal(niche: Niche) {
    const modal = await this.modalCtrl.create({
      component: NicheMaterialModalComponent,
      componentProps: { niche },
      cssClass: 'price-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.notificationService.success('Material actualizado');
      this.loadNiches();
    }
  }

  async openBulkMaterialModal() {
    const selected = this.selectedNiches();
    if (selected.length === 0) {
      this.notificationService.error('Selecciona al menos un nicho');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: BulkMaterialModalComponent,
      componentProps: { niches: selected }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.selectedIds.set(new Set());
      this.selectionMode.set(false);
      this.loadNiches();
    }
  }

  async openCreateModal() {
    const modal = await this.modalCtrl.create({
      component: NicheCreateModalComponent
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.created) {
      this.loadNiches();
    }
  }

  goToDisabled() {
    this.router.navigate(['/columbarium/niches/disabled']);
  }

  async disableNiche(niche: Niche) {
    const alert = await this.alertCtrl.create({
      header: 'Deshabilitar Nicho',
      message: `¿Deshabilitar el nicho ${niche.code}?`,
      inputs: [
        {
          name: 'reason',
          type: 'textarea',
          placeholder: 'Razón de la deshabilitación (ej: daño, reparación)',
          attributes: { minlength: 5 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Deshabilitar',
          handler: (data) => {
            if (!data.reason || data.reason.trim().length < 5) {
              this.notificationService.error('Ingresa una razón válida (mínimo 5 caracteres)');
              return false;
            }
            this.nicheService.disableNiche(niche._id, data.reason.trim()).subscribe({
              next: () => {
                this.notificationService.success(`Nicho ${niche.code} deshabilitado`);
                this.loadNiches();
              },
              error: (err) => this.notificationService.error(err.error?.message || 'Error al deshabilitar')
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async enableNiche(niche: Niche) {
    const confirmed = await this.notificationService.confirm(
      'Habilitar Nicho',
      `¿Habilitar el nicho ${niche.code} nuevamente?`
    );

    if (!confirmed) return;

    this.nicheService.enableNiches(niche._id).subscribe({
      next: () => {
        this.notificationService.success(`Nicho ${niche.code} habilitado`);
        this.loadNiches();
      },
      error: (err) => this.notificationService.error(err.error?.message || 'Error al habilitar')
    });
  }

  // Helpers
  getTypeLabel(type: string): string {
    return type === 'wood' ? 'Madera' : type === 'marble' ? 'Mármol' : 'Especial';
  }

  getTypeColor(type: string): string {
    return type === 'wood' ? 'warning' : type === 'marble' ? 'tertiary' : 'primary';
  }

  clearFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.typeFilter.set('all');
    this.moduleFilter.set('all');
    this.currentPage.set(1);
  }

  get hasActiveFilters(): boolean {
    return this.statusFilter() !== 'all' || this.typeFilter() !== 'all' || this.moduleFilter() !== 'all' || this.searchTerm() !== '';
  }
}
