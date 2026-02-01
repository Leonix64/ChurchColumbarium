import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonList, IonItem, IonLabel, IonInput,
  IonTextarea, IonIcon, IonNote, IonSpinner, IonBadge,
  ModalController, AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, skullOutline, personOutline, cubeOutline,
  arrowForwardOutline, alertCircleOutline, checkmarkCircleOutline,
  calendarOutline
} from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { Beneficiary } from '../../models/beneficiary.model';
import { SuccessionService } from '../../services/succession.service';
import { CustomerService } from '../../services/customer.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-succession-modal',
  templateUrl: './succession-modal.component.html',
  styleUrls: ['./succession-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonList, IonItem, IonLabel, IonInput,
    IonTextarea, IonIcon, IonNote, IonSpinner, IonBadge
  ]
})
export class SuccessionModalComponent implements OnInit {
  @Input() niche!: Niche;
  @Input() customer!: Customer;

  successionForm: FormGroup;
  loading = signal(false);
  nextBeneficiary = signal<Beneficiary | null>(null);
  loadingBeneficiary = signal(false);
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private successionService: SuccessionService,
    private customerService: CustomerService,
    private notificationService: NotificationService
  ) {
    addIcons({
      close, skullOutline, personOutline, cubeOutline,
      arrowForwardOutline, alertCircleOutline, checkmarkCircleOutline,
      calendarOutline
    });

    this.successionForm = this.fb.group({
      deceasedDate: [new Date().toISOString().split('T')[0], Validators.required],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadNextBeneficiary();
  }

  loadNextBeneficiary() {
    this.loadingBeneficiary.set(true);
    this.customerService.getNextBeneficiary(this.customer._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.nextBeneficiary.set(response.data);
        } else {
          this.nextBeneficiary.set(null);
        }
        this.loadingBeneficiary.set(false);
      },
      error: () => {
        this.loadingBeneficiary.set(false);
        this.notificationService.error('Error al cargar beneficiarios');
      }
    });
  }

  async onSubmit() {
    if (this.successionForm.invalid) {
      this.successionForm.markAllAsTouched();
      this.notificationService.error('Complete todos los campos requeridos');
      return;
    }

    if (!this.nextBeneficiary()) {
      this.notificationService.error('No hay beneficiarios disponibles para la sucesión');
      return;
    }

    const formValue = this.successionForm.value;
    const beneficiary = this.nextBeneficiary()!;

    const confirmed = await this.presentConfirmation(beneficiary, formValue.deceasedDate);
    if (!confirmed) return;

    this.loading.set(true);

    const successionData = {
      customerId: this.customer._id,
      nicheId: this.niche._id,
      deceasedDate: new Date(formValue.deceasedDate),
      notes: formValue.notes?.trim() || undefined
    };

    this.successionService.registerSuccession(successionData).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.notificationService.success('Sucesión registrada exitosamente');
          this.modalCtrl.dismiss({
            success: true,
            data: response.data
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  async presentConfirmation(beneficiary: Beneficiary, deceasedDate: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: '⚠️ Confirmar Sucesión',
      message: `
        <div class="succession-confirmation">
          <p><strong>Titular fallecido:</strong></p>
          <p>${this.customer.firstName} ${this.customer.lastName}</p>
          <br>
          <p><strong>Nuevo titular:</strong></p>
          <p>${beneficiary.name} (${beneficiary.relationship})</p>
          <br>
          <p><strong>Fecha de fallecimiento:</strong></p>
          <p>${new Date(deceasedDate).toLocaleDateString('es-MX')}</p>
          <br>
          <p><strong>Nicho:</strong></p>
          <p>${this.niche.code} (#${this.niche.displayNumber})</p>
          <br>
          <p class="warning-text">Esta acción no se puede deshacer. Se creará un nuevo registro de cliente si es necesario.</p>
        </div>
      `,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar Sucesión',
          role: 'confirm',
          cssClass: 'danger-button'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  getRelationshipLabel(relationship: string): string {
    const labels: { [key: string]: string } = {
      'esposo': 'Esposo',
      'esposa': 'Esposa',
      'hijo': 'Hijo',
      'hija': 'Hija',
      'padre': 'Padre',
      'madre': 'Madre',
      'hermano': 'Hermano',
      'hermana': 'Hermana',
      'otro': 'Otro'
    };
    return labels[relationship] || relationship;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}

