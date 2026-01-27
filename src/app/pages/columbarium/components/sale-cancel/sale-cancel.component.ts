import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonListHeader, IonItem, IonLabel,
  IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon,
  IonNote, IonCard, IonCardContent, IonCheckbox, IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, warning, documentTextOutline, cashOutline,
  cardOutline, closeCircle
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Sale } from '../../models/sale.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-sale-cancel',
  standalone: true,
  templateUrl: './sale-cancel.component.html',
  styleUrls: ['./sale-cancel.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonListHeader, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption, IonIcon,
    IonNote, IonCard, IonCardContent, IonCheckbox, IonSpinner,
    CurrencyMxPipe
  ]
})
export class SaleCancelComponent implements OnInit {
  @Input() sale!: Sale;

  cancelForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      close, warning, documentTextOutline, cashOutline,
      cardOutline, closeCircle
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
    // Establecer validación dinámica para refundAmount
    this.cancelForm.get('refundAmount')?.setValidators([
      Validators.min(0),
      Validators.max(this.sale.totalPaid)
    ]);
    this.cancelForm.get('refundAmount')?.updateValueAndValidity();

    // Si hay refund amount, hacer refundMethod requerido
    this.cancelForm.get('refundAmount')?.valueChanges.subscribe(amount => {
      const refundMethodControl = this.cancelForm.get('refundMethod');
      if (amount && amount > 0) {
        refundMethodControl?.setValidators([Validators.required]);
      } else {
        refundMethodControl?.clearValidators();
      }
      refundMethodControl?.updateValueAndValidity();
    });
  }

  async onSubmit() {
    // Marcar todos los campos como touched para mostrar errores
    this.cancelForm.markAllAsTouched();

    console.log('📋 Estado del formulario:', {
      valid: this.cancelForm.valid,
      errors: this.cancelForm.errors,
      values: this.cancelForm.value,
      reasonErrors: this.cancelForm.get('reason')?.errors,
      confirmationValue: this.cancelForm.get('confirmation')?.value
    });

    if (this.cancelForm.invalid) {
      // Mostrar errores específicos
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

    // Validar monto de reembolso
    if (formValue.refundAmount > this.sale.totalPaid) {
      this.notificationService.error(
        `El reembolso no puede exceder $${this.sale.totalPaid.toLocaleString('es-MX')}`
      );
      return;
    }

    // Confirmación final
    const confirmed = await this.notificationService.confirm(
      '¿Confirmar cancelación?',
      `Esta acción es irreversible. El nicho será liberado${formValue.refundAmount > 0 ? ` y se reembolsará $${formValue.refundAmount.toLocaleString('es-MX')}` : ''}.`
    );

    if (!confirmed) return;

    this.loading.set(true);

    // Preparar datos - SOLO enviar lo necesario
    const cancelData: any = {
      reason: formValue.reason.trim()
    };

    // Solo agregar campos de reembolso si hay monto mayor a 0
    if (formValue.refundAmount && Number(formValue.refundAmount) > 0) {
      cancelData.refundAmount = Number(formValue.refundAmount);
      cancelData.refundMethod = formValue.refundMethod || 'cash';

      if (formValue.refundNotes && formValue.refundNotes.trim()) {
        cancelData.refundNotes = formValue.refundNotes.trim();
      }
    }

    console.log('📤 Enviando datos de cancelación:', cancelData);

    // Cancelar venta
    this.saleService.cancelSale(this.sale._id, cancelData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del backend:', response);
        if (response.success) {
          this.notificationService.success('Venta cancelada exitosamente');
          this.modalCtrl.dismiss({
            success: true,
            sale: response.data?.sale
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error completo:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error body:', error.error);
        this.loading.set(false);

        // Mostrar error específico del backend
        if (error.error?.message) {
          this.notificationService.error(error.error.message);
        }
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  // Helpers
  get reason() { return this.cancelForm.get('reason'); }
  get refundAmount() { return this.cancelForm.get('refundAmount'); }
  get refundMethod() { return this.cancelForm.get('refundMethod'); }
  get confirmation() { return this.cancelForm.get('confirmation'); }

  getErrorMessage(field: string): string {
    const control = this.cancelForm.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['min']) return `Mínimo: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Máximo: $${control.errors['max'].max.toLocaleString('es-MX')}`;
    if (control.errors['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}