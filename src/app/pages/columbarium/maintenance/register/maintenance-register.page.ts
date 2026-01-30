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
  close, cashOutline, cardOutline, calendarOutline, checkmarkCircle
} from 'ionicons/icons';

import { MaintenanceService } from '../../services/maintenance.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { Customer } from '../../models/customer.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { Sale } from '../../models/sale.model';

@Component({
  selector: 'app-maintenance-register',
  templateUrl: './maintenance-register.page.html',
  styleUrls: ['./maintenance-register.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonLabel, IonInput, IonSelect,
    IonSelectOption, IonTextarea, IonIcon, IonCard,
    IonCardContent, IonSpinner,
  ]
})
export class MaintenanceRegisterPage implements OnInit {
  @Input() customer!: Customer;
  @Input() defaultAmount: number = 1000; // Monto sugerido de mantenimiento

  maintenanceForm: FormGroup;
  loading = signal(false);

  paymentMethods = [
    { value: 'cash', label: 'Efectivo', icon: '💵' },
    { value: 'card', label: 'Tarjeta', icon: '💳' },
    { value: 'transfer', label: 'Transferencia', icon: '🔄' }
  ];

  availableYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private maintenanceService: MaintenanceService,
    private notificationService: NotificationService,
    private modalCtrl: ModalController
  ) {
    addIcons({
      close, cashOutline, cardOutline, calendarOutline, checkmarkCircle
    });

    this.maintenanceForm = this.fb.group({
      amount: [this.defaultAmount, [Validators.required, Validators.min(1)]],
      method: ['cash', [Validators.required]],
      year: [new Date().getFullYear(), [Validators.required]],
      notes: ['']
    });
  }

  ngOnInit() {
    // Generar años disponibles (actual + 2 años anteriores)
    const currentYear = new Date().getFullYear();
    this.availableYears = [currentYear, currentYear - 1, currentYear - 2];

    // Establecer monto default
    this.maintenanceForm.patchValue({ amount: this.defaultAmount });
  }

  async onSubmit() {
    if (this.maintenanceForm.invalid) {
      this.maintenanceForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    const formValue = this.maintenanceForm.value;

    const confirmed = await this.notificationService.confirm(
      'Confirmar Pago de Mantenimiento',
      `¿Registrar pago de $${formValue.amount} para el año ${formValue.year}?`
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.maintenanceService.registerMaintenance(this.customer._id, {
      amount: Number(formValue.amount),
      method: formValue.method,
      year: Number(formValue.year),
      notes: formValue.notes?.trim() || undefined
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationService.success('Pago de mantenimiento registrado exitosamente');
          this.modalCtrl.dismiss({
            success: true,
            payment: response.data
          });
        }
        console.log(response);
        this.loading.set(false);
      },
      error: (error) => {
        console.log(error);
        this.loading.set(false);
      }
    });
  }
  dismiss() {
    this.modalCtrl.dismiss();
  }

  get amount() { return this.maintenanceForm.get('amount'); }
  get method() { return this.maintenanceForm.get('method'); }
  get year() { return this.maintenanceForm.get('year'); }
  get notes() { return this.maintenanceForm.get('notes'); }
}