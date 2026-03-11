import { Component, OnInit, signal, computed } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonBadge, IonSpinner,
  IonList, IonItem, IonLabel,
  ModalController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, cashOutline, calendarOutline, peopleOutline,
  swapHorizontalOutline, createOutline, cubeOutline,
  checkmarkCircleOutline, alertCircleOutline, timeOutline,
  skullOutline, cartOutline, documentTextOutline,
  ellipsisVertical, informationCircleOutline, closeCircleOutline,
  chevronForwardOutline, banOutline, buildOutline, addOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { CustomerService } from '../../services/customer.service';
import { SaleService } from '../../services/sale.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

import { Niche } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { BeneficiaryRecord, BeneficiaryInput } from '../../models/beneficiary.model';
import { Sale } from '../../models/sale.model';
import { MaintenancePayment } from '../../models/maintenance.model';
import { isPopulated } from 'src/app/shared/domain/type-guards';
import { RELATIONSHIP_LABELS } from 'src/app/shared/domain/constants';

import { BeneficiariesManagerComponent } from '../../beneficiary/manager/beneficiaries-manager.component';
import { NichePriceModalComponent } from '../../components/niche-price-modal/niche-price-modal.component';
import { NicheMaterialModalComponent } from '../../components/niche-material-modal/niche-material-modal.component';
import { OwnershipHistoryModalComponent } from '../../components/ownership-history-modal/ownership-history-modal.component';
import { MaintenanceRegisterPage } from '../../maintenance/register/maintenance-register.page';

@Component({
  selector: 'app-niche-detail',
  templateUrl: './niche-detail.page.html',
  styleUrls: ['./niche-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonBadge, IonSpinner,
    IonList, IonItem, IonLabel,
    EmptyStateComponent, CurrencyMxPipe,
    BeneficiariesManagerComponent
  ]
})
export class NicheDetailPage implements OnInit, ViewWillEnter {
  loading              = signal(true);
  activeTab = signal<'contrato' | 'sucesores' | 'ocupantes' | 'mantenimiento'>('contrato');
  loadingBeneficiaries = signal(false);
  loadingSale          = signal(false);
  editingBeneficiaries = signal(false);
  savingBeneficiaries  = signal(false);
  loadingMaintenance   = signal(false);

  nicheId: string | null = null;
  niche              = signal<Niche | null>(null);
  beneficiaries      = signal<BeneficiaryRecord[]>([]);
  activeSale         = signal<Sale | null>(null);
  maintenancePayments = signal<MaintenancePayment[]>([]);

  readonly currentYear = new Date().getFullYear();

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

  currentYearPaid = computed(() =>
    this.maintenancePayments().some(p => p.maintenanceYear === this.currentYear)
  );

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
    private maintenanceService: MaintenanceService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {
    addIcons({
      personOutline, cashOutline, calendarOutline, peopleOutline,
      swapHorizontalOutline, createOutline, cubeOutline,
      checkmarkCircleOutline, alertCircleOutline, timeOutline,
      skullOutline, cartOutline, documentTextOutline,
      ellipsisVertical, informationCircleOutline, closeCircleOutline,
      chevronForwardOutline, banOutline, buildOutline, addOutline
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
          this.loadMaintenancePayments(id);
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

  loadMaintenancePayments(nicheId: string) {
    this.loadingMaintenance.set(true);
    this.maintenanceService.getMaintenancePayments(nicheId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.maintenancePayments.set(response.data);
        }
        this.loadingMaintenance.set(false);
      },
      error: () => this.loadingMaintenance.set(false)
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

  async openMaintenanceModal() {
    const niche = this.niche();
    if (!niche) return;
    const modal = await this.modalCtrl.create({
      component: MaintenanceRegisterPage,
      componentProps: { niche },
      cssClass: 'maintenance-modal'
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.success && this.nicheId) {
      this.loadMaintenancePayments(this.nicheId);
    }
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

  async confirmDisable() {
    const niche = this.niche();
    if (!niche) return;

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
                if (this.nicheId) this.loadNiche(this.nicheId);
              },
              error: (err: any) => this.notificationService.error(err.error?.message || 'Error al deshabilitar')
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  async confirmEnable() {
    const niche = this.niche();
    if (!niche) return;

    const confirmed = await this.notificationService.confirm(
      'Habilitar Nicho',
      `¿Habilitar el nicho ${niche.code} nuevamente?`
    );
    if (!confirmed) return;

    this.nicheService.enableNiches(niche._id).subscribe({
      next: () => {
        this.notificationService.success(`Nicho ${niche.code} habilitado`);
        if (this.nicheId) this.loadNiche(this.nicheId);
      },
      error: (err: any) => this.notificationService.error(err.error?.message || 'Error al habilitar')
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  getMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash:     'Efectivo',
      card:     'Tarjeta',
      transfer: 'Transferencia'
    };
    return labels[method] ?? method;
  }

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
