import { Component, OnInit, signal, computed } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardContent,
  IonCardTitle, IonBadge, IonSpinner, IonList, IonItem, IonLabel,
  IonRadioGroup, IonRadio, IonListHeader, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonCheckbox, IonNote, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, businessOutline, cashOutline,
  calendarOutline, checkmarkCircle, alertCircle, timeOutline,
  receiptOutline, informationCircleOutline, chevronForwardOutline,
  close, cardOutline, closeCircle, warning, alertCircleOutline,
  chevronDown, chevronUp, shareOutline, locationOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Sale, AmortizationEntry } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { Niche } from '../../models/niche.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { PaymentMethod } from '../../models/payment.model';
import { RegisterPaymentRequest } from '../../models/sale.requests';
import { ResourceHistoryModalComponent } from '../../components/resource-history-modal/resource-history-modal.component';

@Component({
  selector: 'app-sale-detail',
  templateUrl: './sale-detail.page.html',
  styleUrls: ['./sale-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonButton, IonIcon, IonCard, IonCardHeader, IonCardContent,
    IonCardTitle, IonBadge, IonSpinner, IonList, IonItem, IonLabel,
    IonRadioGroup, IonRadio, IonListHeader, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonCheckbox, IonNote,
    EmptyStateComponent, CurrencyMxPipe
  ]
})
export class SaleDetailPage implements OnInit, ViewWillEnter {
  loading = signal(true);
  sale = signal<Sale | null>(null);
  saleId: string | null = null;

  // ── Active tab ─────────────────────────────────────────────────────────────
  activeTab = signal<'amortizacion' | 'pago' | 'cancelar'>('amortizacion');

  // ── Auth ───────────────────────────────────────────────────────────────────
  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // ── Sale computed ──────────────────────────────────────────────────────────
  progress = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return this.saleService.calculateProgress(s);
  });

  downPaymentProgress = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return this.saleService.calculateDownPaymentProgress(s);
  });

  installmentsProgress = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return this.saleService.calculateInstallmentsProgress(s);
  });

  totalPaidAmount = computed(() => this.sale()?.totalPaid || 0);

  nextPendingPayment = computed(() => {
    const s = this.sale();
    if (!s) return null;
    return s.schedule?.find(p =>
      p.status === 'pending' || p.status === 'partial' || p.status === 'overdue'
    );
  });

  customer = computed(() => {
    const s = this.sale();
    return (s?.customer && typeof s.customer === 'object') ? s.customer as Customer : null;
  });

  niche = computed(() => {
    const s = this.sale();
    return (s?.niche && typeof s.niche === 'object') ? s.niche as Niche : null;
  });

  paidPayments = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return s.schedule?.filter(p => p.status === 'paid').length || 0;
  });

  overduePayments = computed(() => {
    const s = this.sale();
    if (!s) return 0;
    return s.schedule?.filter(p => p.status === 'overdue').length || 0;
  });

  canRegisterPayment = computed(() => {
    const status = this.sale()?.status;
    return status === 'active' || status === 'overdue';
  });

  canCancelSale = computed(() => {
    const status = this.sale()?.status;
    return this.isAdmin() && (status === 'active' || status === 'overdue');
  });

  // ── Payment form (ported from PaymentRegisterPage) ─────────────────────────
  payAmount = signal<number>(0);
  payMethod = signal<PaymentMethod>('cash');
  payMode = signal<'free' | 'specific'>('free');
  paySpecificNumber = signal<number | null>(null);
  payNotes = signal<string>('');
  payLoading = signal(false);

  readonly paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'transfer', label: 'Transferencia' }
  ];

  pendingPayments = computed<AmortizationEntry[]>(() =>
    this.sale()?.schedule?.filter(
      p => p.status === 'pending' || p.status === 'partial' || p.status === 'overdue'
    ) ?? []
  );

  payAmountError = computed<string | null>(() => {
    const a = this.payAmount();
    if (!a || a <= 0) return 'El monto es requerido';
    if (a < 1) return 'Mínimo $1';
    if (this.payMode() === 'specific' && this.paySpecificNumber()) {
      const entry = this.sale()?.schedule?.find(p => p.number === this.paySpecificNumber());
      if (entry && a > entry.amountRemaining) {
        return `Excede el saldo de la cuota #${entry.number} ($${entry.amountRemaining.toFixed(2)})`;
      }
    }
    return null;
  });

  paySpecificError = computed<string | null>(() => {
    if (this.payMode() === 'specific' && !this.paySpecificNumber()) {
      return 'Selecciona el número de pago';
    }
    return null;
  });

  payCanSubmit = computed(() =>
    !this.payAmountError() && !this.paySpecificError() && !this.payLoading()
  );

  payCoversFull = computed(() => {
    const s = this.sale();
    return this.payAmount() > 0 && this.payAmount() >= (s?.balance ?? 0);
  });

  payRemaining = computed(() => {
    const s = this.sale();
    return Math.max(0, (s?.balance ?? 0) - this.payAmount());
  });

  // ── Cancel form (ported from SaleCancelComponent) ──────────────────────────
  cancelForm: FormGroup;
  cancelLoading = signal(false);

  // ── Amortization expand ────────────────────────────────────────────────────
  expandedPayment = signal<number | null>(null);

  constructor(
    private saleService: SaleService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    addIcons({
      personOutline, businessOutline, cashOutline,
      calendarOutline, checkmarkCircle, alertCircle, timeOutline,
      receiptOutline, informationCircleOutline, chevronForwardOutline,
      close, cardOutline, closeCircle, warning, alertCircleOutline,
      chevronDown, chevronUp, shareOutline, locationOutline
    });

    this.cancelForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      refundAmount: [0, [Validators.min(0)]],
      refundMethod: ['cash'],
      refundNotes: [''],
      confirmation: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit() {
    this.saleId = this.route.snapshot.paramMap.get('id');
  }

  ionViewWillEnter() {
    if (this.saleId) {
      this.loadSale(this.saleId);
    } else {
      this.loading.set(false);
    }
  }

  loadSale(id: string) {
    this.loading.set(true);
    this.saleService.getById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.sale.set(response.data);
          this.initPaymentForm();
          this.initCancelForm();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar la venta');
      }
    });
  }

  // ── Payment form ───────────────────────────────────────────────────────────

  initPaymentForm() {
    this.payAmount.set(0);
    this.payMethod.set('cash');
    this.payMode.set('free');
    this.paySpecificNumber.set(null);
    this.payNotes.set('');
    const next = this.sale()?.schedule?.find(
      p => p.status === 'pending' || p.status === 'partial'
    );
    if (next) this.payAmount.set(next.amountRemaining);
  }

  onPayModeChange(value: string) {
    this.payMode.set(value as 'free' | 'specific');
    if (value === 'free') this.paySpecificNumber.set(null);
  }

  onPaySpecificNumberChange(value: string | number | null | undefined) {
    const n = value !== null && value !== undefined ? Number(value) : null;
    this.paySpecificNumber.set(n && !isNaN(n) ? n : null);
    if (n) {
      const entry = this.sale()?.schedule?.find(p => p.number === n);
      if (entry) this.payAmount.set(entry.amountRemaining);
    }
  }

  onPayAmountChange(value: string | null | undefined) {
    const n = parseFloat(value ?? '');
    this.payAmount.set(isNaN(n) ? 0 : n);
  }

  onPayMethodChange(value: string) {
    this.payMethod.set(value as PaymentMethod);
  }

  onPayNotesChange(value: string | null | undefined) {
    this.payNotes.set(value ?? '');
  }

  async submitPayment() {
    if (!this.payCanSubmit()) return;
    const s = this.sale();
    if (!s) return;

    if (this.payAmount() > s.balance) {
      const ok = await this.notificationService.confirm(
        'Monto mayor al saldo',
        `El monto es mayor al saldo pendiente. ¿Continuar?`
      );
      if (!ok) return;
    }

    const ok = await this.notificationService.confirm(
      'Confirmar Pago',
      `¿Registrar pago de ${this.payAmount().toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}?`
    );
    if (!ok) return;

    this.payLoading.set(true);

    const payload: RegisterPaymentRequest = {
      amount: this.payAmount(),
      method: this.payMethod(),
      paymentMode: this.payMode(),
      specificPaymentNumber: this.paySpecificNumber() ?? undefined,
      notes: this.payNotes().trim() || undefined
    };

    this.saleService.registerPayment(s._id, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Pago registrado exitosamente');
          this.activeTab.set('amortizacion');
          if (this.saleId) this.loadSale(this.saleId);
        }
        this.payLoading.set(false);
      },
      error: () => this.payLoading.set(false)
    });
  }

  // ── Cancel form ────────────────────────────────────────────────────────────

  initCancelForm() {
    const sale = this.sale();
    if (!sale) return;

    this.cancelForm.reset({
      reason: '',
      refundAmount: 0,
      refundMethod: 'cash',
      refundNotes: '',
      confirmation: false
    });

    this.cancelForm.get('refundAmount')?.setValidators([
      Validators.min(0),
      Validators.max(sale.totalPaid)
    ]);
    this.cancelForm.get('refundAmount')?.updateValueAndValidity();

    this.cancelForm.get('refundAmount')?.valueChanges.subscribe(amount => {
      const refundMethodControl = this.cancelForm.get('refundMethod');
      const numAmount = Number(amount) || 0;
      if (numAmount > 0) {
        refundMethodControl?.setValidators([Validators.required]);
      } else {
        refundMethodControl?.clearValidators();
      }
      refundMethodControl?.updateValueAndValidity();
    });
  }

  async submitCancel() {
    const s = this.sale();
    if (!s) return;

    this.cancelForm.markAllAsTouched();

    if (this.cancelForm.invalid) {
      if (this.cancelForm.get('reason')?.errors) {
        this.notificationService.error('El motivo debe tener al menos 10 caracteres');
        return;
      }
      if (this.cancelForm.get('confirmation')?.errors) {
        this.notificationService.error('Debes confirmar la cancelación');
        return;
      }
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.cancelForm.value;
    const refundAmount = Number(formValue.refundAmount) || 0;

    if (refundAmount > s.totalPaid) {
      this.notificationService.error(`El reembolso no puede exceder $${s.totalPaid.toLocaleString('es-MX')}`);
      return;
    }

    if (refundAmount > 0 && !formValue.refundMethod) {
      this.notificationService.error('Selecciona un método de reembolso');
      return;
    }

    const confirmed = await this.notificationService.confirm(
      '¿Confirmar cancelación?',
      `Esta acción es irreversible. El nicho será liberado${refundAmount > 0 ? ` y se reembolsará $${refundAmount.toLocaleString('es-MX')}` : ''}.`
    );
    if (!confirmed) return;

    this.cancelLoading.set(true);

    const cancelData: {
      reason: string;
      refundAmount?: number;
      refundMethod?: 'cash' | 'card' | 'transfer';
      refundNotes?: string;
    } = { reason: formValue.reason.trim() };

    if (refundAmount > 0) {
      cancelData.refundAmount = refundAmount;
      cancelData.refundMethod = formValue.refundMethod || 'cash';
      if (formValue.refundNotes?.trim()) {
        cancelData.refundNotes = formValue.refundNotes.trim();
      }
    }

    this.saleService.cancelSale(s._id, cancelData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Venta cancelada exitosamente');
          this.router.navigate(['/columbarium/sales']);
        }
        this.cancelLoading.set(false);
      },
      error: (error) => {
        this.cancelLoading.set(false);
        const errorMsg = error.error?.message || 'Error al cancelar la venta';
        const errorDetails = error.error?.details;
        if (errorDetails && Array.isArray(errorDetails)) {
          const detailsMsg = errorDetails.map((d: any) => `${d.field}: ${d.message}`).join(', ');
          this.notificationService.error(`${errorMsg} - ${detailsMsg}`);
        } else {
          this.notificationService.error(errorMsg);
        }
      }
    });
  }

  get cancelReason() { return this.cancelForm.get('reason'); }
  get cancelRefundAmount() { return this.cancelForm.get('refundAmount'); }
  get cancelRefundMethod() { return this.cancelForm.get('refundMethod'); }
  get cancelConfirmation() { return this.cancelForm.get('confirmation'); }

  getCancelErrorMessage(field: string): string {
    const control = this.cancelForm.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['min']) return `Mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Máximo: $${control.errors['max'].max.toLocaleString('es-MX')}`;
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }

  // ── History modal ──────────────────────────────────────────────────────────

  async openResourceHistory() {
    const s = this.sale();
    if (!s?._id) return;

    const modal = await this.modalCtrl.create({
      component: ResourceHistoryModalComponent,
      componentProps: {
        resourceId: s._id,
        resourceTitle: s.folio || 'Venta',
        resourceType: 'Venta'
      },
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });
    await modal.present();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToCustomer() {
    const customer = this.sale()?.customer as Customer;
    if (customer?._id) this.router.navigate(['/columbarium/customers', customer._id]);
  }

  goToNiche() {
    const niche = this.niche();
    if (niche?._id) this.router.navigate(['/columbarium/niches', niche._id]);
  }

  goBack() {
    this.router.navigate(['/columbarium/sales']);
  }

  shareSale() {
    const s = this.sale();
    if (!s) return;
    const customer = s.customer as Customer;
    const niche = s.niche as Niche;
    const text = `Venta: ${s.folio}\nCliente: ${customer.firstName} ${customer.lastName}\nNicho: ${niche.code}\nTotal: $${s.totalAmount.toLocaleString()}\nPagado: $${s.totalPaid.toLocaleString()}\nBalance: $${s.balance.toLocaleString()}\nProgreso: ${this.progress()}%`;
    if (navigator.share) {
      navigator.share({ title: 'Información de Venta', text }).catch(() => { });
    } else {
      navigator.clipboard.writeText(text).then(() => this.notificationService.success('Información copiada'));
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getStatusColor(status: string): string { return this.saleService.getStatusColor(status); }
  getStatusLabel(status: string): string { return this.saleService.getStatusLabel(status); }
  getPaymentStatusColor(status: string): string { return this.saleService.getPaymentStatusColor(status); }
  getPaymentStatusLabel(status: string): string { return this.saleService.getPaymentStatusLabel(status); }

  getPaymentMethodLabel(method: string): string {
    const methods: { [key: string]: string } = {
      'cash': 'Efectivo', 'card': 'Tarjeta', 'transfer': 'Transferencia'
    };
    return methods[method] || method;
  }

  isNextPayment(payment: AmortizationEntry): boolean {
    return payment.number === this.nextPendingPayment()?.number;
  }

  togglePaymentDetails(paymentNumber: number) {
    this.expandedPayment.set(
      this.expandedPayment() === paymentNumber ? null : paymentNumber
    );
  }

  hasPayments(payment: AmortizationEntry): boolean {
    return !!payment.payments?.length;
  }
}
