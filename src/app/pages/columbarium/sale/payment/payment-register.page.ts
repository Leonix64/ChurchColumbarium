import { Component, OnInit, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption,
  IonTextarea, IonIcon, IonCard, IonCardContent, IonSpinner,
  IonRadioGroup, IonRadio, IonListHeader, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, cashOutline, cardOutline, receiptOutline,
  checkmarkCircle, calendarOutline, informationCircleOutline,
  alertCircleOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Sale, AmortizationEntry } from '../../models/sale.model';
import { PaymentMethod } from '../../models/payment.model';
import { RegisterPaymentRequest } from '../../models/sale.requests';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-payment-register',
  templateUrl: './payment-register.page.html',
  styleUrls: ['./payment-register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonTextarea, IonIcon, IonCard, IonCardContent,
    IonSpinner, IonRadioGroup, IonRadio, IonListHeader,
    CurrencyMxPipe
  ]
})
export class PaymentRegisterPage implements OnInit {
  @Input() sale!: Sale;
  @Input() paymentNumber?: number;

  // ── Estado del formulario ──────────────────────────────────────────────────
  amount              = signal<number>(0);
  method              = signal<PaymentMethod>('cash');
  paymentMode         = signal<'free' | 'specific'>('free');
  specificPaymentNumber = signal<number | null>(null);
  notes               = signal<string>('');
  loading             = signal(false);

  // ── Métodos de pago disponibles ───────────────────────────────────────────
  readonly paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash',     label: 'Efectivo',       icon: '💵' },
    { value: 'card',     label: 'Tarjeta',         icon: '💳' },
    { value: 'transfer', label: 'Transferencia',   icon: '🔄' }
  ];

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Cuotas aún pendientes de cobro */
  pendingPayments = computed<AmortizationEntry[]>(() =>
    this.sale?.amortizationTable.filter(
      p => p.status === 'pending' || p.status === 'partial' || p.status === 'overdue'
    ) ?? []
  );

  amountError = computed<string | null>(() => {
    const a = this.amount();
    if (!a || a <= 0) return 'El monto es requerido';
    if (a < 1)        return 'Mínimo $1';

    // [P-01] En modo specific, el monto no puede superar el saldo de la cuota objetivo.
    // El backend también lo valida, pero fallar aquí evita el round-trip y da feedback inmediato.
    if (this.paymentMode() === 'specific' && this.specificPaymentNumber()) {
      const entry = this.getPaymentInfo(this.specificPaymentNumber()!);
      if (entry && a > entry.amountRemaining) {
        return `Excede el saldo de la cuota #${entry.number} ($${entry.amountRemaining.toFixed(2)})`;
      }
    }
    return null;
  });

  specificPaymentError = computed<string | null>(() => {
    if (this.paymentMode() === 'specific' && !this.specificPaymentNumber()) {
      return 'Selecciona el número de pago';
    }
    return null;
  });

  canSubmit = computed(() =>
    !this.amountError() &&
    !this.specificPaymentError() &&
    !this.loading()
  );

  /** Resumen del monto: cubre todo el saldo o queda pendiente */
  coversFull    = computed(() => this.amount() > 0 && this.amount() >= (this.sale?.balance ?? 0));
  remaining     = computed(() => Math.max(0, (this.sale?.balance ?? 0) - this.amount()));

  // ── Constructor ───────────────────────────────────────────────────────────

  constructor(
    private saleService: SaleService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      close, cashOutline, cardOutline, receiptOutline,
      checkmarkCircle, calendarOutline, informationCircleOutline,
      alertCircleOutline
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit() {
    if (this.paymentNumber) {
      // Modo específico pre-seleccionado desde fuera
      const entry = this.sale.amortizationTable.find(p => p.number === this.paymentNumber);
      if (entry) {
        this.paymentMode.set('specific');
        this.specificPaymentNumber.set(this.paymentNumber);
        this.amount.set(entry.amountRemaining);
      }
    } else {
      // Modo libre: pre-cargar monto del siguiente pendiente
      const next = this.sale.amortizationTable.find(
        p => p.status === 'pending' || p.status === 'partial'
      );
      if (next) this.amount.set(next.amountRemaining);
    }
  }

  // ── Handlers de cambio ────────────────────────────────────────────────────

  onPaymentModeChange(value: string) {
    this.paymentMode.set(value as 'free' | 'specific');
    if (value === 'free') this.specificPaymentNumber.set(null);
  }

  onSpecificNumberChange(value: string | number | null | undefined) {
    const n = value !== null && value !== undefined ? Number(value) : null;
    this.specificPaymentNumber.set(n && !isNaN(n) ? n : null);

    // Pre-llenar monto con el saldo de esa cuota
    if (n) {
      const entry = this.sale.amortizationTable.find(p => p.number === n);
      if (entry) this.amount.set(entry.amountRemaining);
    }
  }

  onAmountChange(value: string | null | undefined) {
    const n = parseFloat(value ?? '');
    this.amount.set(isNaN(n) ? 0 : n);
  }

  onMethodChange(value: string) {
    this.method.set(value as PaymentMethod);
  }

  onNotesChange(value: string | null | undefined) {
    this.notes.set(value ?? '');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async onSubmit() {
    if (!this.canSubmit()) return;

    // Advertir si supera el saldo
    if (this.amount() > this.sale.balance) {
      const ok = await this.notificationService.confirm(
        'Monto mayor al saldo',
        `El monto (${this.amount().toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}) es mayor al saldo. ¿Continuar?`
      );
      if (!ok) return;
    }

    const ok = await this.notificationService.confirm(
      'Confirmar Pago',
      `¿Registrar pago de ${this.amount().toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}?`
    );
    if (!ok) return;

    this.loading.set(true);

    const payload: RegisterPaymentRequest = {
      amount:                this.amount(),
      method:                this.method(),
      paymentMode:           this.paymentMode(),
      specificPaymentNumber: this.specificPaymentNumber() ?? undefined,
      notes:                 this.notes().trim() || undefined
    };

    this.saleService.registerPayment(this.sale._id, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Pago registrado exitosamente');
          this.modalCtrl.dismiss({ success: true, payment: response.data?.payment, sale: response.data?.sale });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getPaymentInfo(paymentNumber: number): AmortizationEntry | undefined {
    return this.sale.amortizationTable.find(p => p.number === paymentNumber);
  }
}
