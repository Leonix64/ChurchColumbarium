import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonList, IonItem,
  IonIcon, IonInput, IonSelect,
  IonSelectOption, IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, addCircleOutline, checkmarkCircleOutline, informationCircleOutline, cubeOutline, pricetagOutline } from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-niche-create-modal',
  standalone: true,
  templateUrl: './niche-create-modal.component.html',
  styleUrls: ['./niche-create-modal.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonList, IonItem,
    IonIcon, IonInput, IonSelect,
    IonSelectOption, IonSpinner
  ]
})
export class NicheCreateModalComponent {
  createForm: FormGroup;
  loading = signal(false);

  modules = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  sections = ['A', 'B'];

  materialOptions = [
    { value: 'wood', label: 'Madera', emoji: '🪵', price: 30000 },
    { value: 'marble', label: 'Mármol', emoji: '🪨', price: 35000 },
    { value: 'special', label: 'Especial', emoji: '✨', price: 50000 }
  ];

  // Código generado en tiempo real
  generatedCode = computed(() => {
    const f = this.createForm?.value;
    if (!f?.module || !f?.section || !f?.row || !f?.displayNumber) return '';
    return `${f.module}-${f.section}-${f.row}-${f.displayNumber}`;
  });

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    public nicheService: NicheService,
    private notificationService: NotificationService
  ) {
    addIcons({ close, addCircleOutline, checkmarkCircleOutline, informationCircleOutline, cubeOutline, pricetagOutline });

    this.createForm = this.fb.group({
      module: ['', Validators.required],
      section: ['', Validators.required],
      row: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      displayNumber: [null, [Validators.required, Validators.min(1)]],
      type: ['wood', Validators.required],
      price: [30000, [Validators.required, Validators.min(0)]]
    });
  }

  get selectedMaterialLabel(): string {
    const type = this.createForm.get('type')?.value;
    return this.materialOptions.find(m => m.value === type)?.label || '';
  }

  onMaterialSelect(mat: { value: string; price: number }) {
    this.createForm.patchValue({ type: mat.value, price: mat.price });
  }

  formatCurrency(value: number): string {
    return '$' + (value || 0).toLocaleString('es-MX');
  }

  async onSubmit() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.notificationService.error('Completa todos los campos');
      return;
    }

    const f = this.createForm.value;
    const code = `${f.module}-${f.section}-${f.row}-${f.displayNumber}`;

    const confirmed = await this.notificationService.confirm(
      'Crear Nicho',
      `¿Crear nicho #${f.displayNumber} (${code}) de ${this.selectedMaterialLabel} a ${this.formatCurrency(f.price)}?`
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.nicheService.createNiche({
      module: f.module,
      section: f.section,
      row: f.row,
      displayNumber: f.displayNumber,
      type: f.type,
      price: f.price
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.notificationService.success(response.message || `Nicho #${f.displayNumber} creado`);
          this.modalCtrl.dismiss({ created: true });
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.notificationService.error(error.error?.message || 'Error al crear nicho');
        this.loading.set(false);
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss({ created: false });
  }
}
