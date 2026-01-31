import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonList, IonItem, IonLabel, IonBadge,
  IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, ModalController, ActionSheetController,
  IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, cubeOutline, cashOutline, personOutline,
  calendarOutline, buildOutline, receiptOutline,
  timeOutline, checkmarkCircleOutline, cartOutline
} from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { NicheService } from '../../services/niche.service';
import { MaintenanceService } from '../../services/maintenance.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';
import { MaintenanceRegisterPage } from '../../maintenance/register/maintenance-register.page';
import { MaintenancePayment } from '../../models/maintenance.model';
import { StatusBadgeComponent } from 'src/app/shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-niche-detail-modal',
  standalone: true,
  templateUrl: './niche-detail-modal.component.html',
  styleUrls: ['./niche-detail-modal.component.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonList, IonItem, IonLabel, IonBadge,
    IonIcon,
    CurrencyMxPipe,
    IonSpinner,
    StatusBadgeComponent
  ]
})
export class NicheDetailModalComponent implements OnInit {
  @Input() niche!: Niche;

  maintenanceHistory = signal<MaintenancePayment[]>([]);
  loadingHistory = signal(false);

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    public nicheService: NicheService,
    private maintenanceService: MaintenanceService,
    private notificationService: NotificationService
  ) {
    addIcons({
      close, cubeOutline, cashOutline, personOutline,
      calendarOutline, buildOutline, receiptOutline,
      timeOutline, checkmarkCircleOutline, cartOutline
    });
  }

  ngOnInit() {
    // Si el nicho esta vendido, cargar historial de mantenimiento
    if (this.niche.status === 'sold') {
      this.loadMaintenanceHistory();
    }
  }

  loadMaintenanceHistory() {
    this.loadingHistory.set(true);
    this.maintenanceService.getMaintenancePayments(this.niche._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.maintenanceHistory.set(response.data);
        }
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  async presentActions() {
    const buttons: any[] = [];

    // Acción: Registrar mantenimiento (solo si está vendido)
    if (this.niche.status === 'sold') {
      buttons.push({
        text: 'Registrar Mantenimiento',
        icon: 'build-outline',
        handler: () => this.openMaintenanceModal()
      });
    }

    // Acción: Vender (solo si está disponible)
    if (this.niche.status === 'available') {
      buttons.push({
        text: 'Vender Nicho',
        icon: 'cart-outline',
        handler: () => this.dismiss({ action: 'sell', niche: this.niche })
      });
    }

    // Acción: Ver en grid
    buttons.push({
      text: 'Ver en Grid',
      icon: 'grid-outline',
      handler: () => this.dismiss({ action: 'viewInGrid', niche: this.niche })
    });

    buttons.push({
      text: 'Cancelar',
      role: 'cancel',
      icon: 'close-outline'
    });

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Acciones del Nicho',
      buttons
    });

    await actionSheet.present();
  }

  async openMaintenanceModal() {
    // Verificar que tenga propietario
    if (!this.niche.currentOwner) {
      this.notificationService.error('El nicho no tiene propietario registrado');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: MaintenanceRegisterPage,
      componentProps: {
        niche: this.niche,
        defaultAmount: 1000
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.success) {
      this.notificationService.success('Pago de mantenimiento registrado');
      // Recargar historial
      this.loadMaintenanceHistory();
    }
  }

  getOwnerName(): string {
    if (this.niche.currentOwner && typeof this.niche.currentOwner === 'object') {
      const owner = this.niche.currentOwner as Customer;
      return `${owner.firstName} ${owner.lastName}`;
    }
    return 'Propietario';
  }

  getOwnerPhone(): string {
    if (this.niche.currentOwner && typeof this.niche.currentOwner === 'object') {
      const owner = this.niche.currentOwner as Customer;
      return owner.phone;
    }
    return '';
  }

  getStatusColor(status: string): string {
    return this.nicheService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.nicheService.getStatusLabel(status);
  }

  dismiss(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  viewInGrid() {
    this.modalCtrl.dismiss({ action: 'viewInGrid', niche: this.niche });
  }

  sellNiche() {
    this.modalCtrl.dismiss({ action: 'sell', niche: this.niche });
  }
}
