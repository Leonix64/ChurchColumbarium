import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonIcon, IonButton, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, personOutline, chevronForwardOutline,
  addCircleOutline, createOutline, trashOutline,
  logInOutline, logOutOutline, cashOutline, closeCircleOutline,
  banOutline, checkmarkCircleOutline, constructOutline,
  layersOutline, pricetagOutline, swapHorizontalOutline,
  alertCircleOutline, buildOutline, personAddOutline,
  lockClosedOutline, pulseOutline
} from 'ionicons/icons';

import { AuditLogService } from '../../services/audit.service';
import { AuditLog } from '../../models/audit.model';

@Component({
  selector: 'app-audit-recent-widget',
  templateUrl: './audit-recent-widget.component.html',
  styleUrls: ['./audit-recent-widget.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonIcon, IonButton, IonSpinner
  ]
})
export class AuditRecentWidgetComponent implements OnInit {
  recentLogs = signal<AuditLog[]>([]);
  loading = signal(true);

  constructor(
    public auditService: AuditLogService,
    private router: Router
  ) {
    addIcons({
      timeOutline, personOutline, chevronForwardOutline,
      addCircleOutline, createOutline, trashOutline,
      logInOutline, logOutOutline, cashOutline, closeCircleOutline,
      banOutline, checkmarkCircleOutline, constructOutline,
      layersOutline, pricetagOutline, swapHorizontalOutline,
      alertCircleOutline, buildOutline, personAddOutline,
      lockClosedOutline, pulseOutline
    });
  }

  ngOnInit() {
    this.loadRecent();
  }

  loadRecent() {
    this.loading.set(true);
    this.auditService.getRecent(8).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentLogs.set(response.data);
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

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMin < 1) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;

    return date.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  getDetailText(log: AuditLog): string {
    if (log.details?.description) return log.details.description;
    if (log.resourceId) return `ID: ${log.resourceId}`;
    return '';
  }

  goToAudit() {
    this.router.navigate(['/columbarium/audit']);
  }
}
