import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonList, IonItem,
  IonLabel, IonInput, IonTextarea, IonIcon, IonNote,
  ModalController, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, cashOutline, alertCircleOutline, checkmarkCircleOutline } from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-niche-price-modal',
  standalone: true,
  templateUrl: './niche-price-modal.component.html',
  styleUrls: ['./niche-price-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonList, IonItem,
    IonLabel, IonInput, IonTextarea, IonIcon, IonNote,
    CurrencyMxPipe, IonSpinner
  ]
})
export class NichePriceModalComponent {
  @Input() niche!: Niche;

  priceForm: FormGroup;
  loading = signal(false);
  priceChange = signal(0);
  protected readonly Math = Math;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private nicheService: NicheService,
    private notificationService: NotificationService
  ) {
    addIcons({
      close,
      cashOutline,
      alertCircleOutline,
      checkmarkCircleOutline
    });

    // Formulario
    this.priceForm = this.fb.group({
      newPrice: [0, [Validators.required, Validators.min(1000)]],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {
    // Setear precio actual como valor inicial
    if (this.niche) {
      this.priceForm.patchValue({
        newPrice: this.niche.price
      });
    }

    // Calcular cambio de precio en tiempo real
    this.priceForm.get('newPrice')?.valueChanges.subscribe(newPrice => {
      this.priceChange.set(newPrice - this.niche.price);
    });
  }

  async onSubmit() {
    if (this.priceForm.invalid) {
      this.priceForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos correctamente');
      return;
    }

    const formValue = this.priceForm.value;
    const newPrice = formValue.newPrice;
    const reason = formValue.reason;

    // Confirmación
    const change = newPrice - this.niche.price;
    const changeText = change > 0 ? `+$${change.toLocaleString()}` : `-$${Math.abs(change).toLocaleString()}`;

    const confirmed = await this.notificationService.confirm(
      'Confirmar Cambio de Precio',
      `¿Cambiar precio del nicho ${this.niche.code} de $${this.niche.price.toLocaleString()} a $${newPrice.toLocaleString()} (${changeText})?`
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.nicheService.changePrice(this.niche._id, newPrice, reason).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Precio actualizado correctamente');
          this.modalCtrl.dismiss({
            updated: true,
            newPrice: newPrice
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Error al actualizar precio');
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss({
      updated: false
    });
  }

  // Getters para el template
  get newPrice() { return this.priceForm.get('newPrice'); }
  get reason() { return this.priceForm.get('reason'); }

  // Helpers
  get isIncrease(): boolean {
    return this.priceChange() > 0;
  }

  get isDecrease(): boolean {
    return this.priceChange() < 0;
  }

  get noChange(): boolean {
    return this.priceChange() === 0;
  }

  getErrorMessage(fieldName: string): string {
    const field = this.priceForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['min']) return `Precio mínimo: $${field.errors['min'].min}`;
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }
}