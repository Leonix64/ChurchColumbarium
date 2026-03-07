import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonCard, IonCardContent, IonIcon, IonBadge,
  IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  close, timeOutline, personOutline, calendarOutline,
  addCircleOutline, createOutline, trashOutline,
  logInOutline, logOutOutline, cashOutline, closeCircleOutline,
  banOutline, checkmarkCircleOutline, constructOutline,
  layersOutline, pricetagOutline, swapHorizontalOutline,
  alertCircleOutline, buildOutline, documentTextOutline
} from 'ionicons/icons';

import { AuditLogService } from '../../services/audit.service';
import { AuditLog } from '../../models/audit.model';

@Component({
  selector: 'app-resource-history-modal',
  templateUrl: './resource-history-modal.component.html',
  styleUrls: ['./resource-history-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonCard, IonCardContent, IonIcon, IonBadge,
    IonSpinner
  ]
})
export class ResourceHistoryModalComponent implements OnInit {
  @Input() resourceId!: string;
  @Input() resourceTitle: string = '';
  @Input() resourceType: string = '';

  history = signal<AuditLog[]>([]);
  loading = signal(true);

  constructor(
    private modalCtrl: ModalController,
    public auditService: AuditLogService
  ) {
    addIcons({
      close, timeOutline, personOutline, calendarOutline,
      addCircleOutline, createOutline, trashOutline,
      logInOutline, logOutOutline, cashOutline, closeCircleOutline,
      banOutline, checkmarkCircleOutline, constructOutline,
      layersOutline, pricetagOutline, swapHorizontalOutline,
      alertCircleOutline, buildOutline, documentTextOutline
    });
  }

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.loading.set(true);
    this.auditService.getResourceHistory(this.resourceId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.history.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getLogUser(log: AuditLog): string {
    if (typeof log.user === 'object' && log.user?.fullName) {
      return log.user.fullName;
    }
    return log.username || 'Desconocido';
  }

  getDetailText(log: AuditLog): string {
    if (!log.details) return '';
    if (log.details.description) return log.details.description;
    if (log.details.reason) return log.details.reason;
    if (log.details.amount) return `$${log.details.amount.toLocaleString('es-MX')} MXN`;
    return '';
  }

  formatDate(timestamp: Date): string {
    return new Date(timestamp).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
