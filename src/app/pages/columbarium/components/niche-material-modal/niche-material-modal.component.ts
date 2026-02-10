import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonList, IonItem,
  IonLabel, IonIcon, IonNote, IonRadioGroup, IonRadio,
  IonInput, IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, cubeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

// Precios por defecto según material
const DEFAULT_PRICES: { [key: string]: number } = {
  wood: 30000,
  marble: 35000,
  special: 40000
};

@Component({
  selector: 'app-niche-material-modal',
  standalone: true,
  templateUrl: './niche-material-modal.component.html',
  styleUrls: ['./niche-material-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonList, IonItem,
    IonLabel, IonIcon, IonNote, IonRadioGroup, IonRadio,
    IonInput, IonSpinner,
    CurrencyMxPipe
  ]
})
export class NicheMaterialModalComponent {
  @Input() niche!: Niche;

  materialForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private nicheService: NicheService,
    private notificationService: NotificationService
  ) {
    addIcons({ close, cubeOutline, checkmarkCircleOutline, alertCircleOutline });

    this.materialForm = this.fb.group({
      type: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1000)]]
    });
  }

  ngOnInit() {
    if (this.niche) {
      this.materialForm.patchValue({
        type: this.niche.type,
        price: this.niche.price
      });

      // Cuando cambia el material, sugerir precio por defecto
      this.materialForm.get('type')?.valueChanges.subscribe(newType => {
        if (newType && newType !== this.niche.type) {
          this.materialForm.patchValue({ price: DEFAULT_PRICES[newType] || this.niche.price });
        } else {
          this.materialForm.patchValue({ price: this.niche.price });
        }
      });
    }
  }

  get selectedType(): string {
    return this.materialForm.get('type')?.value;
  }

  get isSameMaterial(): boolean {
    return this.selectedType === this.niche.type;
  }

  get price() {
    return this.materialForm.get('price');
  }

  getMaterialLabel(type: string): string {
    return type === 'wood' ? 'Madera' : type === 'marble' ? 'Mármol' : 'Especial';
  }

  getErrorMessage(fieldName: string): string {
    const field = this.materialForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['min']) return `Precio mínimo: $${field.errors['min'].min}`;

    return 'Campo inválido';
  }

  async onSubmit() {
    if (this.materialForm.invalid || this.isSameMaterial) {
      this.materialForm.markAllAsTouched();
      return;
    }

    const { type, price } = this.materialForm.value;

    const confirmed = await this.notificationService.confirm(
      'Confirmar Cambio de Material',
      `¿Cambiar el material del nicho ${this.niche.code} de ${this.getMaterialLabel(this.niche.type)} a ${this.getMaterialLabel(type)}? Nuevo precio: $${price.toLocaleString('es-MX')}`
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.nicheService.changeMaterial(this.niche._id, type, price).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success('Material actualizado correctamente');
          this.modalCtrl.dismiss({ updated: true, newMaterial: type });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Error al actualizar material');
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss({ updated: false });
  }
}
