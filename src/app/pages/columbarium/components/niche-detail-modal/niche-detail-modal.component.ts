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

import { SuccessionModalComponent } from '../succession-modal/succession-modal.component';
import { OwnershipHistoryModalComponent } from '../ownership-history-modal/ownership-history-modal.component';
import { NichePriceModalComponent } from '../niche-price-modal/niche-price-modal.component';
import { NicheMaterialModalComponent } from '../niche-material-modal/niche-material-modal.component';
import { AuthService } from 'src/app/core/services/auth.service';

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
    private notificationService: NotificationService,
    public authService: AuthService
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

    // Acción: Ver historial de titularidad
    buttons.push({
      text: 'Historial de Titularidad',
      icon: 'time-outline',
      handler: () => this.openOwnershipHistory()
    });

    const isAdmin = this.authService.currentUser()?.role === 'admin';
    if (isAdmin && (this.niche.status === 'available' || this.niche.status === 'reserved')) {
      buttons.push({
        text: 'Cambiar Precio',
        icon: 'cash-outline',
        handler: () => this.openPriceModal()
      });
      buttons.push({
        text: 'Cambiar Material',
        icon: 'cube-outline',
        handler: () => this.openMaterialModal()
      });
    }

    // Acción: Registrar sucesión (solo si está vendido)
    if (this.niche.status === 'sold') {
      buttons.push({
        text: 'Registrar Sucesión',
        icon: 'swap-horizontal-outline',
        handler: () => this.openSuccessionModal()
      });
    }

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

  async openSuccessionModal() {
    // Primero necesitamos el customer completo
    const owner = this.niche.currentOwner;
    if (!owner || typeof owner === 'string') {
      this.notificationService.error('No se pudo cargar información del propietario');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: SuccessionModalComponent,
      componentProps: {
        niche: this.niche,
        customer: owner
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.success) {
      // Recargar nicho
      this.loadMaintenanceHistory();
      this.notificationService.success('Sucesión registrada. El nicho tiene un nuevo titular.');
    }
  }

  async openOwnershipHistory() {
    const modal = await this.modalCtrl.create({
      component: OwnershipHistoryModalComponent,
      componentProps: {
        niche: this.niche
      },
      cssClass: 'large-modal'
    });

    await modal.present();
  }

  async openPriceModal() {
    const modal = await this.modalCtrl.create({
      component: NichePriceModalComponent,
      componentProps: { niche: this.niche },
      cssClass: 'price-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.notificationService.success(`Precio actualizado a ${data.newPrice.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`);

      // Recargar nicho para ver el nuevo precio
      this.nicheService.getById(this.niche._id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.niche = response.data;
          }
        }
      });
    }
  }

  async openMaterialModal() {
    const modal = await this.modalCtrl.create({
      component: NicheMaterialModalComponent,
      componentProps: { niche: this.niche },
      cssClass: 'price-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      this.notificationService.success('Material actualizado correctamente');
      this.nicheService.getById(this.niche._id).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.niche = response.data;
          }
        }
      });
    }
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
