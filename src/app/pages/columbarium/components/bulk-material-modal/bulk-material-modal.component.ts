import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonList, IonItem,
  IonLabel, IonIcon, IonNote, IonRadioGroup, IonRadio,
  IonInput, IonSpinner, IonBadge, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, cubeOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';

const DEFAULT_PRICES: { [key: string]: number } = {
  wood: 30000,
  marble: 35000,
  special: 40000
};

@Component({
  selector: 'app-bulk-material-modal',
  standalone: true,
  templateUrl: './bulk-material-modal.component.html',
  styleUrls: ['./bulk-material-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonList, IonItem,
    IonLabel, IonIcon, IonNote, IonRadioGroup, IonRadio,
    IonInput, IonSpinner, IonBadge
  ]
})
export class BulkMaterialModalComponent {
  @Input() niches: Niche[] = [];

  bulkForm: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private nicheService: NicheService,
    private notificationService: NotificationService
  ) {
    addIcons({ close, cubeOutline, checkmarkCircleOutline, alertCircleOutline });

    this.bulkForm = this.fb.group({
      type: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1000)]]
    });

    this.bulkForm.get('type')?.valueChanges.subscribe(newType => {
      if (newType) {
        this.bulkForm.patchValue({ price: DEFAULT_PRICES[newType] || 30000 });
      }
    });
  }

  get eligibleNiches(): Niche[] {
    return this.niches.filter(n => n.status !== 'sold');
  }

  get soldCount(): number {
    return this.niches.filter(n => n.status === 'sold').length;
  }

  get price() {
    return this.bulkForm.get('price');
  }

  getMaterialLabel(type: string): string {
    return type === 'wood' ? 'Madera' : type === 'marble' ? 'Mármol' : 'Especial';
  }

  getErrorMessage(fieldName: string): string {
    const field = this.bulkForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    if (field.errors['required']) return 'Campo requerido';
    if (field.errors['min']) return `Precio mínimo: $${field.errors['min'].min}`;
    return 'Campo inválido';
  }

  async onSubmit() {
    if (this.bulkForm.invalid || this.eligibleNiches.length === 0) {
      this.bulkForm.markAllAsTouched();
      return;
    }

    const { type, price } = this.bulkForm.value;
    const ids = this.eligibleNiches.map(n => n._id);

    const confirmed = await this.notificationService.confirm(
      'Confirmar Cambio Masivo',
      `¿Cambiar ${ids.length} nicho(s) a ${this.getMaterialLabel(type)} con precio $${price.toLocaleString('es-MX')}?${this.soldCount > 0 ? ` (${this.soldCount} nicho(s) vendido(s) serán excluidos)` : ''}`
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.nicheService.bulkChangeMaterial(ids, type, price).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Material actualizado masivamente');
          this.modalCtrl.dismiss({ updated: true, count: ids.length });
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
