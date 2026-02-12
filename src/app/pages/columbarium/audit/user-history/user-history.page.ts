import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonSpinner, IonBadge, IonNote,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, timeOutline, calendarOutline, statsChartOutline,
  trendingUpOutline, chevronDownOutline, addCircleOutline,
  createOutline, trashOutline, cashOutline, logInOutline,
  logOutOutline, closeCircleOutline, banOutline, checkmarkCircleOutline,
  layersOutline, constructOutline, swapHorizontalOutline,
  alertCircleOutline, lockClosedOutline, personAddOutline,
  pricetagOutline, buildOutline, gridOutline, keyOutline,
  cartOutline, peopleOutline, documentTextOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import { AuditLogService } from '../../services/audit.service';
import { AuditLog } from '../../models/audit.model';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-user-history',
  templateUrl: './user-history.page.html',
  styleUrls: ['./user-history.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonButton, IonIcon, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonSpinner, IonBadge, IonNote,
    IonRefresher, IonRefresherContent,
    HeaderComponent, EmptyStateComponent
  ]
})
export class UserHistoryPage implements OnInit {
  userId = '';
  userName = signal('Usuario');
  userRole = signal('');

  // Estado
  loading = signal(true);
  loadingMore = signal(false);
  logs = signal<AuditLog[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  totalLogs = signal(0);
  pageSize = 20;

  // Stats calculadas
  totalActions = signal(0);
  dailyAverage = signal(0);
  lastActivity = signal<string>('Sin actividad');
  favoriteModule = signal<string>('');
  favoriteModuleCount = signal(0);

  constructor(
    private route: ActivatedRoute,
    public auditService: AuditLogService
  ) {
    addIcons({
      personOutline, timeOutline, calendarOutline, statsChartOutline,
      trendingUpOutline, chevronDownOutline, addCircleOutline,
      createOutline, trashOutline, cashOutline, logInOutline,
      logOutOutline, closeCircleOutline, banOutline, checkmarkCircleOutline,
      layersOutline, constructOutline, swapHorizontalOutline,
      alertCircleOutline, lockClosedOutline, personAddOutline,
      pricetagOutline, buildOutline, gridOutline, keyOutline,
      cartOutline, peopleOutline, documentTextOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';

    // Si se pasó nombre y role como queryParams
    const qp = this.route.snapshot.queryParams;
    if (qp['name']) this.userName.set(qp['name']);
    if (qp['role']) this.userRole.set(qp['role']);

    this.loadHistory();
  }

  doRefresh(event: any) {
    this.currentPage.set(1);
    this.loadHistory(true);
    setTimeout(() => event.target.complete(), 2000);
  }

  loadHistory(reset = false) {
    if (reset) {
      this.loading.set(true);
      this.logs.set([]);
    }

    this.auditService.getUserHistory(this.userId, {
      limit: this.pageSize,
      page: this.currentPage()
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          if (reset || this.currentPage() === 1) {
            this.logs.set(response.data || []);
          } else {
            this.logs.set([...this.logs(), ...(response.data || [])]);
          }
          this.totalPages.set(response.pages || 1);
          this.totalLogs.set(response.total || 0);
          this.totalActions.set(response.total || 0);

          // Extraer nombre del usuario del primer log
          if (response.data?.length > 0 && !this.route.snapshot.queryParams['name']) {
            const firstLog = response.data[0];
            if (typeof firstLog.user === 'object' && firstLog.user?.fullName) {
              this.userName.set(firstLog.user.fullName);
              this.userRole.set(firstLog.user.role || '');
            } else if (firstLog.username) {
              this.userName.set(firstLog.username);
              this.userRole.set(firstLog.userRole || '');
            }
          }

          // Calcular stats solo en primera carga
          if (this.currentPage() === 1) {
            this.calculateStats(response.data || []);
          }
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    });
  }

  loadMore() {
    if (this.currentPage() < this.totalPages()) {
      this.loadingMore.set(true);
      this.currentPage.set(this.currentPage() + 1);
      this.loadHistory();
    }
  }

  private calculateStats(logs: AuditLog[]) {
    // Ultima actividad
    if (logs.length > 0) {
      this.lastActivity.set(this.formatTimestamp(logs[0].timestamp));
    }

    // Promedio diario (basado en rango de fechas de logs disponibles)
    const total = this.totalActions();
    if (logs.length > 1) {
      const newest = new Date(logs[0].timestamp).getTime();
      const oldest = new Date(logs[logs.length - 1].timestamp).getTime();
      const daysDiff = Math.max(1, Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24)));
      this.dailyAverage.set(Math.round(total / daysDiff));
    } else {
      this.dailyAverage.set(total);
    }

    // Modulo favorito
    const moduleCount = new Map<string, number>();
    logs.forEach(log => {
      moduleCount.set(log.module, (moduleCount.get(log.module) || 0) + 1);
    });
    let maxMod = '';
    let maxCount = 0;
    moduleCount.forEach((count, mod) => {
      if (count > maxCount) {
        maxCount = count;
        maxMod = mod;
      }
    });
    if (maxMod) {
      this.favoriteModule.set(this.auditService.getModuleLabel(maxMod));
      this.favoriteModuleCount.set(maxCount);
    }
  }

  // Helpers
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

  formatFullDate(timestamp: Date): string {
    return new Date(timestamp).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  get hasMorePages(): boolean {
    return this.currentPage() < this.totalPages();
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      'admin': 'Administrador',
      'seller': 'Vendedor',
      'viewer': 'Visualizador'
    };
    return labels[role] || role;
  }
}
