import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CanDeactivateWizard } from 'src/app/shared/guards/wizard-deactivate.guard';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
  IonTitle, IonIcon, IonBadge, IonSpinner,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle,
  IonInput, IonTextarea
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, closeCircleOutline, alertCircleOutline,
  skullOutline, personOutline, arrowBackOutline, arrowForwardOutline,
  informationCircleOutline, swapHorizontalOutline,
  warningOutline, checkmarkDoneOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { BeneficiaryService } from '../../services/beneficiary.service';
import { CustomerService } from '../../services/customer.service';
import { SuccessionService } from '../../services/succession.service';
import { NotificationService } from 'src/app/core/services/notification.service';

import { Niche } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { BeneficiaryRecord } from '../../models/beneficiary.model';
import { Sale } from '../../models/sale.model';
import { isPopulated } from 'src/app/shared/domain/type-guards';
import { RELATIONSHIP_LABELS } from 'src/app/shared/domain/constants';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-succession-wizard',
  templateUrl: './succession-wizard.page.html',
  styleUrls: ['./succession-wizard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonButton,
    IonTitle, IonIcon, IonBadge, IonSpinner,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonInput, IonTextarea,
    CurrencyMxPipe
  ]
})
export class SuccessionWizardPage implements OnInit, CanDeactivateWizard {

  nicheId: string | null = null;

  // ── Wizard step (0 = preflight, 1 = data, 2 = confirm) ─────────────────────
  step = signal<0 | 1 | 2>(0);

  // ── Loading states ────────────────────────────────────────────────────────
  loadingPreflight = signal(true);
  submitting       = signal(false);

  // ── Domain data ───────────────────────────────────────────────────────────
  niche         = signal<Niche | null>(null);
  owner         = signal<Customer | null>(null);
  beneficiaries = signal<BeneficiaryRecord[]>([]);
  activeSale    = signal<Sale | null>(null);

  // ── Form fields ───────────────────────────────────────────────────────────
  deceasedDate = signal<string>('');
  notes        = signal<string>('');

  /** Max date allowed for the date picker */
  readonly today = new Date().toISOString().split('T')[0];

  // ── Computed ──────────────────────────────────────────────────────────────

  eligibleBeneficiaries = computed(() =>
    [...this.beneficiaries()].sort((a, b) => a.order - b.order)
  );

  /** Beneficiario que heredará (el primero elegible por orden) */
  nextBeneficiary = computed(() => this.eligibleBeneficiaries()[0] ?? null);

  // ── Preflight checks (computed individually para claridad en el template) ──

  checkNicheIsSold            = computed(() => this.niche()?.status === 'sold');
  checkHasOwner               = computed(() => !!this.niche()?.currentOwner);
  /**
   * INFORMATIVO — no bloquea la sucesión.
   * En el modelo relacional, estar en niche.currentOwner ya garantiza que
   * no hubo sucesión previa para este nicho. El status del cliente puede
   * ser 'inactive' (desactivado manualmente) y la sucesión sigue siendo válida.
   */
  checkOwnerIsActive          = computed(() => this.owner()?.active === true);
  checkHasEligibleBeneficiary = computed(() => this.eligibleBeneficiaries().length > 0);
  /** Informativo: si hay contrato activo la deuda se transfiere también */
  checkHasActiveSale          = computed(() => !!this.activeSale());

  /**
   * Checks CRÍTICOS: nicho vendido + tiene titular + tiene sucesor elegible.
   * checkOwnerIsActive es INFORMATIVO — no bloquea (estar en currentOwner
   * es garantía suficiente de que no pasó por sucesión en este nicho).
   */
  allChecksPassed = computed(() =>
    this.checkNicheIsSold() &&
    this.checkHasOwner() &&
    this.checkHasEligibleBeneficiary()
  );

  /** Error de validación para la fecha de fallecimiento (null = válido) */
  dateError = computed<string | null>(() => {
    const d = this.deceasedDate();
    if (!d) return 'La fecha de fallecimiento es requerida';
    if (d > this.today) return 'La fecha no puede ser futura';
    return null;
  });

  canAdvanceStep1 = computed(() => !this.dateError());

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nicheService: NicheService,
    private beneficiaryService: BeneficiaryService,
    private customerService: CustomerService,
    private successionService: SuccessionService,
    private notificationService: NotificationService
  ) {
    addIcons({
      checkmarkCircleOutline, closeCircleOutline, alertCircleOutline,
      skullOutline, personOutline, arrowBackOutline, arrowForwardOutline,
      informationCircleOutline, swapHorizontalOutline,
      warningOutline, checkmarkDoneOutline
    });
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  /** Puede salir libremente solo si está en el paso 0 y no está enviando */
  canDeactivate(): boolean {
    return this.step() === 0 && !this.submitting();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    this.nicheId = this.route.snapshot.paramMap.get('nicheId');
    // Default: fecha de fallecimiento = hoy
    this.deceasedDate.set(this.today);
    if (this.nicheId) {
      this.runPreflight(this.nicheId);
    } else {
      this.loadingPreflight.set(false);
    }
  }

  // ── Preflight loading ─────────────────────────────────────────────────────

  runPreflight(nicheId: string) {
    this.loadingPreflight.set(true);

    this.nicheService.getById(nicheId).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.loadingPreflight.set(false);
          this.notificationService.error('Nicho no encontrado');
          return;
        }

        const n = response.data;
        this.niche.set(n);

        // Extraer propietario si viene populated
        if (isPopulated<Customer>(n.currentOwner)) {
          this.owner.set(n.currentOwner as Customer);
        }

        // Cargar beneficiarios del nicho
        this.beneficiaryService.getByNiche(nicheId).subscribe({
          next: (bResp) => {
            if (bResp.success && bResp.data) {
              this.beneficiaries.set(bResp.data);
            }
            // Cargar venta activa (si hay titular)
            const o = this.owner();
            if (o?._id) {
              this.loadActiveSale(o._id, nicheId);
            } else {
              this.loadingPreflight.set(false);
            }
          },
          error: () => this.loadingPreflight.set(false)
        });
      },
      error: () => {
        this.loadingPreflight.set(false);
        this.notificationService.error('Error al verificar el nicho');
      }
    });
  }

  private loadActiveSale(ownerId: string, nicheId: string) {
    this.customerService.getCustomerSales(ownerId).subscribe({
      next: (sResp) => {
        if (sResp.success && sResp.data) {
          const active = sResp.data.find(s => {
            const sNicheId = isPopulated<Niche>(s.niche)
              ? (s.niche as Niche)._id
              : s.niche as string;
            return sNicheId === nicheId && s.status !== 'cancelled';
          });
          this.activeSale.set(active ?? null);
        }
        this.loadingPreflight.set(false);
      },
      error: () => this.loadingPreflight.set(false)
    });
  }

  // ── Step navigation ───────────────────────────────────────────────────────

  nextStep() {
    const s = this.step();
    if (s === 0 && this.allChecksPassed()) {
      this.step.set(1);
    } else if (s === 1 && this.canAdvanceStep1()) {
      this.step.set(2);
    }
  }

  prevStep() {
    const s = this.step();
    if (s === 0) {
      // Volver al NicheDetail
      this.router.navigate(['/columbarium/niches', this.nicheId]);
    } else {
      this.step.set((s - 1) as 0 | 1);
    }
  }

  goToNicheDetail() {
    this.router.navigate(['/columbarium/niches', this.nicheId]);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  confirmSuccession() {
    // Guard anti-doble-click
    if (this.submitting()) return;

    const niche = this.niche();
    const owner = this.owner();
    if (!niche || !owner) return;

    this.submitting.set(true);

    const payload = {
      customerId: owner._id,
      nicheId:    niche._id,
      deceasedDate: new Date(this.deceasedDate()),
      notes: this.notes()?.trim() || undefined
    };

    this.successionService.registerSuccession(payload).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const newName = response.data.newOwner?.name ?? 'nuevo titular';
          this.notificationService.success(`Sucesión registrada. Nuevo titular: ${newName}`);
          // Navegar al NicheDetail del nicho afectado (replaceUrl evita volver al wizard con Back)
          this.router.navigate(['/columbarium/niches', niche._id], { replaceUrl: true });
        } else {
          this.submitting.set(false);
          this.notificationService.error('Error al registrar la sucesión');
        }
      },
      error: () => {
        this.submitting.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getRelationshipLabel(rel: string): string {
    return RELATIONSHIP_LABELS[rel] ?? rel;
  }

  /** Convierte "2026-02-23" → "23/02/2026" */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return dateStr.split('-').reverse().join('/');
  }
}
