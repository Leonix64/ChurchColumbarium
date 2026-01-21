// src/app/pages/columbarium/sales/payment/payment-register.page.ts

import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect,
  IonSelectOption, IonTextarea, IonIcon, IonNote, IonCard,
  IonCardContent, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, cashOutline, cardOutline, receiptOutline,
  checkmarkCircle, calendarOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Sale } from '../../models/sale.model';
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
    IonCardContent, IonSpinner,
    CurrencyMxPipe
  ]
})
export class PaymentRegisterPage implements OnInit {
  @Input() sale!: Sale;
  @Input() paymentNumber!: number;

  paymentForm: FormGroup;
  loading = signal(false);

  // 💳 MÉTODOS DE PAGO
  paymentMethods: { value: PaymentMethod; label: string; icon: string }[] = [
    { value: 'cash', label: 'Efectivo', icon: 'cash-outline' },
    { value: 'card', label: 'Tarjeta', icon: 'card-outline' },
    { value: 'transfer', label: 'Transferencia', icon: 'swap-horizontal-outline' }
  ];

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      close, cashOutline, cardOutline, receiptOutline,
      checkmarkCircle, calendarOutline
    });

    // Inicializar formulario
    this.paymentForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      method: ['cash', [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit() {
    // Auto-llenar el monto del pago correspondiente
    const payment = this.sale.amortizationTable.find(p => p.number === this.paymentNumber);
    if (payment) {
      this.paymentForm.patchValue({
        amount: payment.amount
      });
    }
  }

  // 💾 REGISTRAR PAGO
  async onSubmit() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    // Confirmar
    const confirmed = await this.notificationService.confirm(
      'Confirmar Pago',
      `¿Registrar pago #${this.paymentNumber} de ${this.paymentForm.value.amount}?`
    );

    if (!confirmed) return;

    this.loading.set(true);

    // Preparar request
    const paymentData: RegisterPaymentRequest = {
      amount: this.paymentForm.value.amount,
      method: this.paymentForm.value.method,
      paymentNumber: this.paymentNumber,
      notes: this.paymentForm.value.notes?.trim() || undefined
    };

    // Enviar
    this.saleService.registerPayment(this.sale._id, paymentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Pago registrado exitosamente');

          // Cerrar modal con éxito
          this.modalCtrl.dismiss({
            success: true,
            payment: response.data?.payment
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  // ❌ CANCELAR
  dismiss() {
    this.modalCtrl.dismiss();
  }

  // 🎨 HELPERS
  get amount() { return this.paymentForm.get('amount'); }
  get method() { return this.paymentForm.get('method'); }
  get notes() { return this.paymentForm.get('notes'); }

  getPaymentInfo() {
    return this.sale.amortizationTable.find(p => p.number === this.paymentNumber);
  }

  getErrorMessage(field: string): string {
    const control = this.paymentForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['min']) return `Mínimo: ${control.errors['min'].min}`;

    return 'Campo inválido';
  }
}