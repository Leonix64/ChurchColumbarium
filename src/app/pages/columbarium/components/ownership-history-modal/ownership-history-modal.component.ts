import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent,
  IonIcon, IonBadge, IonSpinner, IonNote,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, timeOutline, personOutline, calendarOutline,
  swapHorizontalOutline, cartOutline, heartOutline
} from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { OwnershipHistory } from '../../models/beneficiary.model';
import { SuccessionService } from '../../services/succession.service';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-ownership-history-modal',
  templateUrl: './ownership-history-modal.component.html',
  styleUrls: ['./ownership-history-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent,
    IonIcon, IonBadge, IonSpinner, IonNote
  ]
})
export class OwnershipHistoryModalComponent implements OnInit {
  @Input() niche!: Niche;

  history = signal<OwnershipHistory[]>([]);
  loading = signal(true);
  currentOwner = signal<any>(null);

  constructor(
    private modalCtrl: ModalController,
    private successionService: SuccessionService,
    private notificationService: NotificationService
  ) {
    addIcons({
      close, timeOutline, personOutline, calendarOutline,
      swapHorizontalOutline, cartOutline, heartOutline
    });
  }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.successionService.getOwnershipHistory(this.niche._id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.history.set(response.data.history || []);
          this.currentOwner.set(response.data.currentOwner);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar historial');
      }
    });
  }

  getReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'purchase': 'Compra Original',
      'succession': 'Sucesión',
      'transfer': 'Transferencia',
      'inheritance': 'Herencia'
    };
    return labels[reason] || reason;
  }

  getReasonIcon(reason: string): string {
    const icons: { [key: string]: string } = {
      'purchase': 'cart-outline',
      'succession': 'swap-horizontal-outline',
      'transfer': 'swap-horizontal-outline',
      'inheritance': 'git-branch-outline'
    };
    return icons[reason] || 'document-outline';
  }

  getReasonColor(reason: string): string {
    const colors: { [key: string]: string } = {
      'purchase': 'success',
      'succession': 'warning',
      'transfer': 'primary',
      'inheritance': 'tertiary'
    };
    return colors[reason] || 'medium';
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}