import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonSegment, IonSegmentButton,
  IonLabel, IonChip, IonSpinner, ModalController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  optionsOutline, informationCircleOutline, gridOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { NicheDetailModalComponent } from '../../components/niche-detail-modal/niche-detail-modal.component';
import { Niche, SectionGroup, ModuleGroup } from '../../models/niche.model';

@Component({
  selector: 'app-niches-detail',
  templateUrl: './niches-detail.page.html',
  styleUrls: ['./niches-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonSegment, IonSegmentButton,
    IonLabel, IonChip, IonSpinner,
    EmptyStateComponent
  ]
})
export class NichesDetailPage implements OnInit {
  loading = signal(true);
  currentModule = signal<string>('');
  currentSection = signal<string>('');
  typeFilter = signal<'all' | 'wood' | 'marble'>('all');
  highlightedNiche = signal<string | null>(null);

  // Data from service
  niches = this.nicheService.niches;
  moduleGroups = this.nicheService.moduleGroups;

  // Current module info
  moduleInfo = computed(() => {
    return this.moduleGroups().find(m => m.module === this.currentModule());
  });

  // Available sections in current module
  availableSections = computed(() => {
    const module = this.moduleInfo();
    return module ? module.sections.map(s => s.section).sort() : [];
  });

  // Current section data
  sectionData = computed(() => {
    const module = this.moduleInfo();
    if (!module) return null;
    return module.sections.find(s => s.section === this.currentSection());
  });

  // Filtered niches for current section and type filter
  filteredNiches = computed(() => {
    const section = this.sectionData();
    if (!section) return [];

    let niches = section.niches;

    // Aplicar filtro de tipo
    const filter = this.typeFilter();
    if (filter !== 'all') {
      niches = niches.filter(n => n.type === filter);
    }

    // Ordenar por fila (de 7 a 1, arriba a abajo) y luego por columna
    return niches.sort((a, b) => {
      if (b.row !== a.row) {
        return b.row - a.row; // Fila 7 primero
      }
      return a.number - b.number; // Columna ascendente
    });
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nicheService: NicheService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({ optionsOutline, informationCircleOutline, gridOutline });
  }

  ngOnInit() {
    // Obtener parametros de ruta
    const module = this.route.snapshot.paramMap.get('module');
    const section = this.route.snapshot.paramMap.get('section');

    if (!module || !section) {
      this.notificationService.error('Módulo o sección no especificados');
      this.router.navigate(['/columbarium/niches']);
      return;
    }

    this.currentModule.set(module.toUpperCase());
    this.currentSection.set(section.toUpperCase());

    // Cargar nichos si no estan cargados
    if (this.niches().length === 0) {
      this.loadNiches();
    } else {
      this.loading.set(false);
      this.checkHighlight();
    }
  }

  loadNiches() {
    this.loading.set(true);
    this.nicheService.getAll({
      module: this.currentModule(),
      section: this.currentSection()
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.checkHighlight();
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar nichos');
      }
    });
  }

  // Verificar si hay un nicho para destacar (desde query params)
  checkHighlight() {
    const highlight = this.route.snapshot.queryParamMap.get('highlight');
    if (highlight) {
      this.highlightedNiche.set(highlight);
      // Quitar highlight después de 10 segundos
      setTimeout(() => this.highlightedNiche.set(null), 10000);
    }
  }

  // Calcular columnas del grid basado en número de nichos por fila
  getGridColumns(): string {
    const section = this.sectionData();
    if (!section) return 'repeat(10, 1fr)';
    return `repeat(${section.nichesPerRow}, 1fr)`;
  }

  // Cambiar seccion
  onSectionChange(event: any) {
    const newSection = event.detail.value;
    this.currentSection.set(newSection);

    // Actualizar URL
    this.router.navigate(
      ['/columbarium/niches/module', this.currentModule(), newSection],
      { replaceUrl: true }
    );
  }

  // Cambiar filtro de tipo
  setTypeFilter(filter: 'all' | 'wood' | 'marble') {
    this.typeFilter.set(filter);
  }

  // Abrir modal de detalle de nicho
  async openNicheDetail(niche: Niche) {
    if (niche.status === 'disabled') {
      this.notificationService.error('Este nicho está deshabilitado');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: NicheDetailModalComponent,
      componentProps: { niche },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8,
      cssClass: 'niche-detail-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      if (data.action === 'sell') {
        this.goToSale(data.niche);
      }
    }
  }

  // Ir a crear venta
  goToSale(niche: Niche) {
    this.router.navigate(['/columbarium/sales/create'], {
      queryParams: { nicheId: niche._id }
    });
  }

  // Menu de filtros/opciones
  async presentFilterMenu() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Opciones',
      buttons: [
        {
          text: 'Ver todos los tipos',
          icon: 'grid-outline',
          handler: () => this.setTypeFilter('all')
        },
        {
          text: 'Solo madera',
          icon: 'filter-outline',
          handler: () => this.setTypeFilter('wood')
        },
        {
          text: 'Solo mármol',
          icon: 'filter-outline',
          handler: () => this.setTypeFilter('marble')
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });

    await actionSheet.present();
  }

  goBack() {
    this.router.navigate(['/columbarium/niches']);
  }
}