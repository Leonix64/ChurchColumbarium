import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonNote, IonCard, IonCardContent, IonSpinner, IonRadioGroup, IonRadio, ModalController, IonListHeader } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, cashOutline, cardOutline, receiptOutline,
  checkmarkCircle, calendarOutline, informationCircleOutline
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
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonTextarea, IonIcon, IonNote, IonCard,
    IonCardContent, IonSpinner, IonRadioGroup, IonRadio,
    CurrencyMxPipe,
    IonListHeader
  ]
})
export class PaymentRegisterPage implements OnInit {
  @Input() sale!: Sale;
  @Input() paymentNumber?: number;

  paymentForm: FormGroup;
  loading = signal(false);

  // Métodos de pago
  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'transfer', label: 'Transferencia', icon: '🔄' }
  ];

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      close, cashOutline, cardOutline, receiptOutline,
      checkmarkCircle, calendarOutline, informationCircleOutline
    });

    // Modo de pago agregado
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      method: ['cash', [Validators.required]],
      paymentMode: ['free'],
      specificPaymentNumber: [null],
      notes: ['']
    });
  }

  ngOnInit() {
    // Si viene paymentNumber, pre-seleccionar modo específico
    if (this.paymentNumber) {
      const payment = this.sale.schedule.find(p => p.number === this.paymentNumber);
      if (payment) {
        this.paymentForm.patchValue({
          amount: payment.amountRemaining,
          paymentMode: 'specific',
          specificPaymentNumber: this.paymentNumber
        });
      }
    } else {
      // Modo libre: calcular próximo pago pendiente
      const nextPending = this.sale.schedule.find(p => p.status === 'pending' || p.status === 'partial');
      if (nextPending) {
        this.paymentForm.patchValue({
          amount: nextPending.amountRemaining
        });
      }
    }

    // Cambiar entre modo libre/específico
    this.paymentForm.get('paymentMode')?.valueChanges.subscribe(mode => {
      if (mode === 'specific') {
        this.paymentForm.get('specificPaymentNumber')?.setValidators([Validators.required]);
      } else {
        this.paymentForm.get('specificPaymentNumber')?.clearValidators();
        this.paymentForm.patchValue({ specificPaymentNumber: null });
      }
      this.paymentForm.get('specificPaymentNumber')?.updateValueAndValidity();
    });
  }

  // Obtener pagos pendientes
  getPendingPayments() {
    return this.sale.schedule.filter(p =>
      p.status === 'pending' || p.status === 'partial' || p.status === 'overdue'
    );
  }

  // Registrar pago
  async onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.paymentForm.value;

    // Validar monto
    if (formValue.amount <= 0) {
      this.notificationService.error('El monto debe ser mayor a 0');
      return;
    }

    if (formValue.amount > this.sale.balance) {
      const confirmed = await this.notificationService.confirm(
        'Monto mayor al saldo',
        `El monto ($${formValue.amount}) es mayor al saldo ($${this.sale.balance}). ¿Continuar?`
      );
      if (!confirmed) return;
    }

    // Confirmar
    const confirmed = await this.notificationService.confirm(
      'Confirmar Pago',
      `¿Registrar pago de $${formValue.amount}?`
    );
    if (!confirmed) return;

    this.loading.set(true);

    // PREPARAR REQUEST CON MODO DE PAGO
    const paymentData: RegisterPaymentRequest = {
      amount: Number(formValue.amount),
      method: formValue.method,
      paymentMode: formValue.paymentMode,
      specificPaymentNumber: formValue.specificPaymentNumber || undefined,
      notes: formValue.notes?.trim() || undefined
    };

    console.log('Enviando pago:', paymentData);

    this.saleService.registerPayment(this.sale._id, paymentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Pago registrado exitosamente');
          this.modalCtrl.dismiss({
            success: true,
            payment: response.data?.payment,
            sale: response.data?.sale
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  // HELPERS
  get amount() { return this.paymentForm.get('amount'); }
  get method() { return this.paymentForm.get('method'); }
  get paymentMode() { return this.paymentForm.get('paymentMode'); }
  get specificPaymentNumber() { return this.paymentForm.get('specificPaymentNumber'); }
  get notes() { return this.paymentForm.get('notes'); }

  getPaymentInfo(paymentNumber: number) {
    return this.sale.schedule.find((p: AmortizationEntry) => p.number === paymentNumber);
  }

  getErrorMessage(field: string): string {
    const control = this.paymentForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['min']) return `Mínimo: ${control.errors['min'].min}`;

    return 'Campo inválido';
  }
}
