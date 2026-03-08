import { Component, OnInit, signal, computed } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonBadge, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonList, IonItem, IonLabel,
  ModalController, ActionSheetController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cashOutline, calendarOutline, peopleOutline,
  swapHorizontalOutline, createOutline, cubeOutline,
  checkmarkCircleOutline, alertCircleOutline, timeOutline,
  skullOutline, cartOutline, documentTextOutline,
  ellipsisVertical, informationCircleOutline, closeCircleOutline,
  chevronForwardOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { CustomerService } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

import { Niche } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { BeneficiaryRecord, BeneficiaryInput } from '../../models/beneficiary.model';
import { Sale } from '../../models/sale.model';
import { isPopulated } from 'src/app/shared/domain/type-guards';
import { RELATIONSHIP_LABELS } from 'src/app/shared/domain/constants';

import { BeneficiariesManagerComponent } from '../../beneficiary/manager/beneficiaries-manager.component';
import { NichePriceModalComponent } from '../../components/niche-price-modal/niche-price-modal.component';
import { NicheMaterialModalComponent } from '../../components/niche-material-modal/niche-material-modal.component';
import { OwnershipHistoryModalComponent } from '../../components/ownership-history-modal/ownership-history-modal.component';

@Component({
  selector: 'app-niche-detail',
  templateUrl: './niche-detail.page.html',
  styleUrls: ['./niche-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonBadge, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonList, IonItem, IonLabel,
    EmptyStateComponent, CurrencyMxPipe,
    BeneficiariesManagerComponent
  ]
})
export class NicheDetailPage implements OnInit, ViewWillEnter {
  loading             = signal(true);
  loadingBeneficiaries = signal(false);
  loadingSale          = signal(false);
  editingBeneficiaries = signal(false);
  savingBeneficiaries  = signal(false);

  nicheId: string | null = null;
  niche        = signal<Niche | null>(null);
  beneficiaries = signal<BeneficiaryRecord[]>([]);
  activeSale    = signal<Sale | null>(null);

  /** Buffer local para el editor de beneficiarios (no reactivo) */
  private pendingBeneficiaries: BeneficiaryInput[] = [];

  // ── Computed ────────────────────────────────────────────────────────────────

  owner = computed<Customer | null>(() => {
    const n = this.niche();
    return isPopulated<Customer>(n?.currentOwner) ? n!.currentOwner as Customer : null;
  });

  eligibleBeneficiaries = computed(() =>
    this.beneficiaries()
  );

  canStartSuccession = computed(() => {
    const n = this.niche();
    return n?.status === 'sold'
      && !!this.owner()
      && this.eligibleBeneficiaries().length > 0;
  });

  /** Razón por la que no se puede iniciar sucesión (null = puede hacerse) */
  successionBlockReason = computed<string | null>(() => {
    const n = this.niche();
    if (!n || n.status !== 'sold') return null;
    if (!this.owner()) return 'Sin titular registrado';
    if (this.eligibleBeneficiaries().length === 0) return 'Sin sucesores elegibles designados';
    return null;
  });

  saleProgress = computed(() => {
    const s = this.activeSale();
    if (!s) return 0;
    return this.saleService.calculateProgress(s);
  });

  saleDownPaymentProgress = computed(() => {
    const s = this.activeSale();
    if (!s) return 0;
    return this.saleService.calculateDownPaymentProgress(s);
  });

  saleInstallmentsProgress = computed(() => {
    const s = this.activeSale();
    if (!s) return 0;
    return this.saleService.calculateInstallmentsProgress(s);
  });

  isAdmin = computed(() => this.authService.currentUser()?.role === 'admin');
  canEdit = computed(() =>
    ['admin', 'seller'].includes(this.authService.currentUser()?.role ?? '')
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public  nicheService: NicheService,
    private beneficiaryService: BeneficiaryService,
    private customerService: CustomerService,
    private saleService: SaleService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
  ) {
    addIcons({
      personOutline, cashOutline, calendarOutline, peopleOutline,
      swapHorizontalOutline, createOutline, cubeOutline,
      checkmarkCircleOutline, alertCircleOutline, timeOutline,
      skullOutline, cartOutline, documentTextOutline,
      ellipsisVertical, informationCircleOutline, closeCircleOutline,
      chevronForwardOutline
    });
  }

  ngOnInit() {
    this.nicheId = this.route.snapshot.paramMap.get('id');
  }

  ionViewWillEnter() {
    if (this.nicheId) {
      this.loadNiche(this.nicheId);
    } else {
      this.loading.set(false);
    }
  }

  // ── Loaders ─────────────────────────────────────────────────────────────────

  loadNiche(id: string) {
    this.loading.set(true);
    this.nicheService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.niche.set(response.data);
          this.loadBeneficiaries(id);
          this.loadActiveSale();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar el nicho');
      }
    });
  }

  loadBeneficiaries(nicheId: string) {
    this.loadingBeneficiaries.set(true);
    this.beneficiaryService.getByNiche(nicheId).subscribe({
      next: (response) => {
        if (response.success && response.data) this.beneficiaries.set(response.data);
        this.loadingBeneficiaries.set(false);
      },
      error: () => this.loadingBeneficiaries.set(false)
    });
  }

  loadActiveSale() {
    const owner = this.owner();
    if (!owner?._id) return;

    this.loadingSale.set(true);
    this.customerService.getCustomerSales(owner._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const active = response.data.find(s => {
            const sNicheId = isPopulated<Niche>(s.niche)
              ? (s.niche as Niche)._id
              : s.niche as string;
            return sNicheId === this.nicheId && s.status !== 'cancelled';
          });
          this.activeSale.set(active ?? null);
        }
        this.loadingSale.set(false);
      },
      error: () => this.loadingSale.set(false)
    });
  }

  // ── Beneficiary inline editor ────────────────────────────────────────────────

  startEditingBeneficiaries() {
    // Pre-cargar lista actual para que "Guardar sin cambios" funcione
    this.pendingBeneficiaries = this.eligibleBeneficiaries().map(b => ({
      name: b.name,
      relationship: b.relationship,
      phone: b.phone,
      email: b.email,
      dateOfBirth: b.dateOfBirth
        ? new Date(b.dateOfBirth).toISOString().split('T')[0]
        : undefined,
      order: b.order,
      notes: b.notes
    }));
    this.editingBeneficiaries.set(true);
  }

  onBeneficiariesChange(list: BeneficiaryInput[]) {
    this.pendingBeneficiaries = list;
  }

  saveBeneficiaries() {
    const owner = this.owner();
    if (!owner?._id || !this.nicheId) return;

    this.savingBeneficiaries.set(true);
    this.beneficiaryService
      .updateByNiche(this.nicheId!, this.pendingBeneficiaries)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.notificationService.success('Sucesores actualizados');
            this.editingBeneficiaries.set(false);
            if (this.nicheId) this.loadBeneficiaries(this.nicheId);
          }
          this.savingBeneficiaries.set(false);
        },
        error: () => this.savingBeneficiaries.set(false)
      });
  }

  cancelEditing() {
    this.editingBeneficiaries.set(false);
    this.pendingBeneficiaries = [];
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  goToCustomer() {
    const o = this.owner();
    if (o?._id) this.router.navigate(['/columbarium/customers', o._id]);
  }

  goToSale() {
    const s = this.activeSale();
    if (s?._id) this.router.navigate(['/columbarium/sales', s._id]);
  }

  goToCreateSale() {
    this.router.navigate(['/columbarium/sales/create'], {
      queryParams: { nicheId: this.nicheId }
    });
  }

  goBack() {
    this.router.navigate(['/columbarium/niches']);
  }

  // ── Modals ───────────────────────────────────────────────────────────────────

  // TODO: deceased-beneficiary-modal pendiente
  // openDeceasedModal eliminado — componente no existe aún

  openSuccessionModal() {
    // Fase 3: navegar al wizard de sucesión en lugar del modal antiguo
    if (!this.nicheId) return;
    this.router.navigate(['/columbarium/succession/wizard', this.nicheId]);
  }

  async openPriceModal() {
    const niche = this.niche();
    if (!niche) return;
    const modal = await this.modalCtrl.create({
      component: NichePriceModalComponent,
      componentProps: { niche },
      cssClass: 'price-modal'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.updated && this.nicheId) this.loadNiche(this.nicheId);
  }

  async openMaterialModal() {
    const niche = this.niche();
    if (!niche) return;
    const modal = await this.modalCtrl.create({
      component: NicheMaterialModalComponent,
      componentProps: { niche },
      cssClass: 'price-modal'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.updated && this.nicheId) this.loadNiche(this.nicheId);
  }

  async openOwnershipHistory() {
    const niche = this.niche();
    if (!niche) return;
    const modal = await this.modalCtrl.create({
      component: OwnershipHistoryModalComponent,
      componentProps: { niche },
      cssClass: 'large-modal'
    });
    await modal.present();
  }

  async presentAdminMenu() {
    const niche = this.niche();
    if (!niche) return;

    const buttons: any[] = [
      {
        text: 'Historial de Titularidad',
        icon: 'time-outline',
        handler: () => this.openOwnershipHistory()
      }
    ];

    if (this.isAdmin() && (niche.status === 'available' || niche.status === 'reserved')) {
      buttons.push(
        { text: 'Cambiar Precio',   icon: 'cash-outline', handler: () => this.openPriceModal()    },
        { text: 'Cambiar Material', icon: 'cube-outline', handler: () => this.openMaterialModal() }
      );
    }

    buttons.push({ text: 'Cancelar', role: 'cancel', icon: 'close-circle-outline' });
    const sheet = await this.actionSheetCtrl.create({ header: 'Opciones del Nicho', buttons });
    await sheet.present();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getRelationshipLabel(rel: string): string {
    return RELATIONSHIP_LABELS[rel] ?? rel;
  }

  getOwnerStatusColor(status?: string): string {
    if (status === 'active') return 'success';
    return 'medium';
  }

  getOwnerStatusLabel(status?: string): string {
    if (status === 'active')   return 'Activo';
    if (status === 'inactive') return 'Inactivo';
    return 'Sin estado';
  }

  getNicheStatusColor(status: string): string { return this.nicheService.getStatusColor(status); }
  getNicheStatusLabel(status: string): string { return this.nicheService.getStatusLabel(status); }
  getSaleStatusColor(status: string): string  { return this.saleService.getStatusColor(status);  }
  getSaleStatusLabel(status: string): string  { return this.saleService.getStatusLabel(status);  }
}
