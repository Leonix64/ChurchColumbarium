import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonSearchbar,
  IonButton, IonIcon, IonSpinner, IonBadge,
  IonList, IonItem, IonNote, IonSelect, IonSelectOption,
  ModalController, AlertController, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline, cashOutline, buildOutline, banOutline,
  checkmarkCircleOutline, searchOutline, createOutline,
  filterOutline, refreshOutline, ellipsisVerticalOutline,
  pricetagOutline, gridOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { NicheDetailModalComponent } from '../../components/niche-detail-modal/niche-detail-modal.component';
import { NichePriceModalComponent } from '../../components/niche-price-modal/niche-price-modal.component';
import { NicheMaterialModalComponent } from '../../components/niche-material-modal/niche-material-modal.component';
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
    IonList, IonItem, IonNote, IonSelect, IonSelectOption,
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

  niches = this.nicheService.niches;
  stats = this.nicheService.stats;

  // Filtros computados
  filteredNiches = computed(() => {
    let result = this.niches();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(n =>
        n.code.toLowerCase().includes(search) ||
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

  // Módulos disponibles para el filtro
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
      pricetagOutline, gridOutline
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
  }

  onStatusFilter(event: any) {
    this.statusFilter.set(event.detail?.value || 'all');
  }

  onTypeFilter(event: any) {
    this.typeFilter.set(event.detail?.value || 'all');
  }

  onModuleFilter(event: any) {
    this.moduleFilter.set(event.detail?.value || 'all');
  }

  // Abrir detalle del nicho
  async openDetail(niche: Niche) {
    const modal = await this.modalCtrl.create({
      component: NicheDetailModalComponent,
      componentProps: { niche },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.action === 'sell') {
      this.router.navigate(['/columbarium/sales/create'], {
        queryParams: { nicheId: data.niche._id }
      });
    } else if (data?.action === 'viewInGrid') {
      this.router.navigate(['/columbarium/niches/module', data.niche.module, data.niche.section], {
        queryParams: { highlight: data.niche.code }
      });
    }
  }

  // Cambiar precio
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

  // Cambiar material
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

  // Deshabilitar nicho
  // Backend: POST /api/niches/:id/disable con { nicheIds: [id], reason }
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

  // Habilitar nicho
  // Backend: POST /api/niches/enable con { nicheIds: [id] }
  async enableNiche(niche: Niche) {
    const confirmed = await this.notificationService.confirm(
      'Habilitar Nicho',
      `¿Habilitar el nicho ${niche.code} nuevamente?`
    );

    if (!confirmed) return;

    this.nicheService.enableNiche(niche._id).subscribe({
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
  }

  get hasActiveFilters(): boolean {
    return this.statusFilter() !== 'all' || this.typeFilter() !== 'all' || this.moduleFilter() !== 'all' || this.searchTerm() !== '';
  }
}
