import { Component, OnInit, signal, computed } from '@angular/core';
import { CanDeactivateWizard } from 'src/app/shared/guards/wizard-deactivate.guard';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
  IonTitle, IonIcon, IonBadge, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonInput, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, personOutline, businessOutline, cashOutline,
  arrowBackOutline, arrowForwardOutline, checkmarkCircleOutline,
  informationCircleOutline, peopleOutline,
  alertCircleOutline, calculatorOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NicheService } from '../../services/niche.service';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

import { Customer } from '../../models/customer.model';
import { Niche } from '../../models/niche.model';
import { BeneficiaryInput } from '../../models/beneficiary.model';

import { BeneficiariesManagerComponent } from '../../beneficiary/manager/beneficiaries-manager.component';
import { CustomerSearchModalComponent } from '../../components/customer-search-modal/customer-search-modal.component';
import { NicheSearchModalComponent } from '../../components/niche-search-modal/niche-search-modal.component';

@Component({
  selector: 'app-sale-create',
  templateUrl: './sale-create.page.html',
  styleUrls: ['./sale-create.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonTitle, IonIcon, IonBadge, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonInput,
    CurrencyMxPipe,
    BeneficiariesManagerComponent
  ]
})
export class SaleCreatePage implements OnInit, CanDeactivateWizard {

  // ── Wizard step (0 = niche, 1 = client+beneficiaries, 2 = finance+confirm) ─
  step = signal<0 | 1 | 2>(0);

  // ── Loading states ────────────────────────────────────────────────────────
  loadingNiche = signal(false);
  submitting   = signal(false);

  // ── Domain data ───────────────────────────────────────────────────────────
  selectedNiche    = signal<Niche | null>(null);
  selectedCustomer = signal<Customer | null>(null);

  // ── Beneficiaries (REQUIRED — backend exige ≥3 antes de crear la venta) ───
  pendingBeneficiaries = signal<BeneficiaryInput[]>([]);

  // ── Financial input (Step 2) ──────────────────────────────────────────────
  downPayment = signal<number>(0);

  // ── Computed ──────────────────────────────────────────────────────────────

  totalAmount    = computed(() => this.selectedNiche()?.price ?? 0);
  minDownPayment = computed(() => Math.ceil(this.totalAmount() * 0.1));

  balance = computed(() => {
    const dp    = this.downPayment();
    const total = this.totalAmount();
    return dp > 0 && dp < total ? total - dp : total;
  });

  monthlyPayment = computed(() => {
    const dp    = this.downPayment();
    const total = this.totalAmount();
    return dp > 0 && dp < total
      ? this.saleService.calculateMonthly(total, dp)
      : 0;
  });

  downPaymentError = computed<string | null>(() => {
    const dp    = this.downPayment();
    const total = this.totalAmount();
    if (dp <= 0) return null; // not yet filled — show no error until user types
    if (dp >= total) return 'El enganche debe ser menor al total';
    const min = this.minDownPayment();
    if (dp < min) return `Mínimo 10% del total: ${min.toLocaleString('es-MX')}`;
    return null;
  });

  /** Beneficiarios con nombre (≥3 chars) Y parentesco completados */
  validBeneficiariesCount = computed(() =>
    this.pendingBeneficiaries().filter(
      b => (b.name?.trim().length ?? 0) >= 3 && !!b.relationship
    ).length
  );

  canAdvanceStep0 = computed(() =>
    !!this.selectedNiche() && this.selectedNiche()!.status === 'available'
  );
  /** Requiere cliente seleccionado Y al menos 3 sucesores válidos */
  canAdvanceStep1 = computed(() =>
    !!this.selectedCustomer() && this.validBeneficiariesCount() >= 3
  );
  /** Datos financieros válidos — controla visibilidad de resumen y partes */
  hasValidFinancials = computed(() => {
    const dp    = this.downPayment();
    const total = this.totalAmount();
    return dp > 0 && dp < total && dp >= this.minDownPayment();
  });
  /** hasValidFinancials + no submitting — controla el botón de confirmar */
  canSubmit = computed(() => this.hasValidFinancials() && !this.submitting());

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private saleService: SaleService,
    private nicheService: NicheService,
    private beneficiaryService: BeneficiaryService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      searchOutline, personOutline, businessOutline, cashOutline,
      arrowBackOutline, arrowForwardOutline, checkmarkCircleOutline,
      informationCircleOutline, peopleOutline,
      alertCircleOutline, calculatorOutline
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    // Pre-selección de nicho desde NicheDetailPage (o cualquier navegación con ?nicheId=)
    const nicheId = this.route.snapshot.queryParamMap.get('nicheId');
    if (nicheId) {
      this.preloadNiche(nicheId);
    }
  }

  // ── Niche pre-loading ─────────────────────────────────────────────────────

  private preloadNiche(nicheId: string) {
    this.loadingNiche.set(true);
    this.nicheService.getById(nicheId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.selectedNiche.set(response.data);
          // Auto-avanzar a Paso 1 solo si el nicho está disponible
          if (response.data.status === 'available') {
            this.step.set(1);
          }
        }
        this.loadingNiche.set(false);
      },
      error: () => this.loadingNiche.set(false)
    });
  }

  // ── Modal launchers ───────────────────────────────────────────────────────

  async openNicheSearch() {
    const modal = await this.modalCtrl.create({ component: NicheSearchModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.niche) {
      this.selectedNiche.set(data.niche);
    }
  }

  async openCustomerSearch() {
    const modal = await this.modalCtrl.create({ component: CustomerSearchModalComponent });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (data?.customer) {
      this.selectedCustomer.set(data.customer);
    }
  }

  // ── Beneficiaries ─────────────────────────────────────────────────────────

  onBeneficiariesChange(list: BeneficiaryInput[]) {
    this.pendingBeneficiaries.set(list);
  }

  // ── Down payment input ────────────────────────────────────────────────────

  onDownPaymentChange(value: string | null | undefined) {
    const num = parseFloat(value ?? '');
    this.downPayment.set(isNaN(num) ? 0 : num);
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  nextStep() {
    const s = this.step();
    if (s === 0 && this.canAdvanceStep0()) {
      this.step.set(1);
    } else if (s === 1 && this.canAdvanceStep1()) {
      this.step.set(2);
    }
  }

  prevStep() {
    const s = this.step();
    if (s === 0) {
      this.router.navigate(['/columbarium/sales']);
    } else {
      this.step.set((s - 1) as 0 | 1);
    }
  }

  /** Guard: sin progreso → puede salir libremente; con progreso → pide confirmación */
  canDeactivate(): boolean {
    return this.step() === 0 && !this.selectedNiche() && !this.submitting();
  }

  cancel() {
    this.router.navigate(['/columbarium/sales']);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  confirmSale() {
    if (this.submitting()) return; // guard anti-doble-click

    const niche    = this.selectedNiche();
    const customer = this.selectedCustomer();

    if (!niche || !customer || !this.canSubmit()) return;

    this.submitting.set(true);

    // ── ORDEN CORRECTO ──────────────────────────────────────────────────────
    // El backend valida ≥3 beneficiarios activos al crear la venta.
    // Por eso: 1) guardar beneficiarios → 2) crear venta → 3) navegar.

    const validBenefs = this.pendingBeneficiaries()
      .filter(b => (b.name?.trim().length ?? 0) >= 3 && !!b.relationship)
      .map((b, i) => ({ ...b, order: b.order ?? i + 1 }));

    this.beneficiaryService.updateByNiche(niche._id, validBenefs).subscribe({
      next: () => {
        this.saleService.create({
          customerId:  customer._id,
          nicheId:     niche._id,
          totalAmount: niche.price,
          downPayment: this.downPayment()
        }).subscribe({
          next: (response) => {
            if (response.success) {
              this.notificationService.success('Venta y sucesores registrados exitosamente');
              this.router.navigate(['/columbarium/niches', niche._id], { replaceUrl: true });
            } else {
              this.submitting.set(false);
            }
          },
          error: (err) => {
            console.error('Venta error:', err);
            this.submitting.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Beneficiarios error:', err);
        this.notificationService.error('Error al guardar los sucesores. Verifica los datos.');
        this.submitting.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getNicheStatusLabel(status: string): string { return this.nicheService.getStatusLabel(status); }
  getNicheStatusColor(status: string): string { return this.nicheService.getStatusColor(status); }
  getNicheTypeLabel(type: string):  string { return type === 'marble' ? 'Mármol' : 'Madera'; }
}
