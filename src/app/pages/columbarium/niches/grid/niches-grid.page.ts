import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonSearchbar, IonSegment, IonSegmentButton,
  IonLabel, IonButton, IonIcon, IonSpinner, AlertController, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronForward, cubeOutline, arrowForward,
  searchOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { NicheDetailModalComponent } from '../../components/niche-detail-modal/niche-detail-modal.component';
import { ModuleGroup, Niche } from '../../models/niche.model';


@Component({
  selector: 'app-niches-grid',
  templateUrl: './niches-grid.page.html',
  styleUrls: ['./niches-grid.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonSearchbar, IonSegment, IonSegmentButton,
    IonLabel, IonButton, IonIcon, IonSpinner,
    HeaderComponent, EmptyStateComponent
  ]
})
export class NichesGridPage implements OnInit {
  loading = signal(true);
  searchModule = signal('');
  statusFilter = signal<'all' | 'available' | 'sold'>('all');

  // Data from service
  moduleGroups = this.nicheService.moduleGroups;
  stats = this.nicheService.stats;

  // Filtered modules
  filteredModules = computed(() => {
    let modules = this.moduleGroups();

    // Filtro por nombre de modulo
    const search = this.searchModule().toLowerCase();
    if (search) {
      modules = modules.filter(m =>
        m.module.toLowerCase().includes(search) ||
        m.moduleName.toLowerCase().includes(search)
      );
    }

    // Filtro por estado
    const status = this.statusFilter();
    if (status === 'available') {
      modules = modules.filter(m => m.availableNiches > 0);
    } else if (status === 'sold') {
      modules = modules.filter(m => m.soldNiches > 0);
    }

    return modules;
  });

  constructor(
    public notificationService: NotificationService,
    private nicheService: NicheService,
    private modalCtrl: ModalController,
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ chevronForward, cubeOutline, arrowForward, searchOutline });
  }

  ngOnInit() {
    this.loadNiches();
  }

  loadNiches() {
    this.loading.set(true);
    this.nicheService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  onSearchModule(event: any) {
    const term = event.target?.value || '';
    this.searchModule.set(term);
  }

  // Busqueda rapida por codigo
  async openQuickSearch() {
    const alert = await this.alertCtrl.create({
      header: 'Busqueda rapida',
      message: 'Ingresa el codigo completo del nicho',
      inputs: [
        {
          name: 'code',
          type: 'text',
          placeholder: 'Ej: A-A-1-52',
          attributes: {
            maxlength: 20,
            autocapitalize: 'characters'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Buscar',
          handler: (data) => {
            if (data.code && data.code.trim()) {
              this.searchNicheByCode(data.code.trim().toUpperCase());
            }
          }
        }
      ]
    });
    await alert.present();
  }

  // Buscar nicho por codigo
  async searchNicheByCode(code: string) {
    const loading = await this.notificationService.loading('Buscando nicho...');

    this.nicheService.getByCode(code).subscribe({
      next: async (response) => {
        loading.dismiss();

        if (response.success && response.data) {
          // Abrir modal con detalle del nicho
          this.openNicheDetail(response.data);
        } else {
          this.notificationService.error('Nicho no encontrado');
        }
      },
      error: async () => {
        (await loading).dismiss();
        this.notificationService.error('Error al buscar nicho');
      }
    });
  }

  // Abrir modal con detalle
  async openNicheDetail(niche: Niche) {
    const modal = await this.modalCtrl.create({
      component: NicheDetailModalComponent,
      componentProps: {
        niche: niche
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8,
      cssClass: 'niche-detail-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      if (data.action === 'viewInGrid') {
        this.goToNicheInGrid(data.niche);
      } else if (data.action === 'sell') {
        this.goToSale(data.niche);
      }
    }
  }

  goToNicheInGrid(niche: Niche) {
    this.router.navigate([
      '/columbarium/niches/module',
      niche.module,
      niche.section,
    ], {
      queryParams: { highlight: niche.code }
    });
  }

  goToSale(niche: Niche) {
    this.router.navigate(['/columbarium/sales/create'], {
      queryParams: { nicheId: niche._id }
    });
  }

  onFilterChange(event: any) {
    const value = event.detail?.value || 'all';
    this.statusFilter.set(value);
  }

  goToModuleDetail(moduleGroup: ModuleGroup) {
    // Para navegar al detalle del modulo con su primera seccion
    const section = moduleGroup.sections[0];
    this.router.navigate([
      '/columbarium/niches/module',
      moduleGroup.module,
      section.section
    ]);
  }
}
