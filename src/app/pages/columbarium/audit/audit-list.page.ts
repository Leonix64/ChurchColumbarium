import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonButton, IonIcon, IonLabel, IonBadge,
  IonSpinner, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonSelect, IonSelectOption,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, personOutline, documentTextOutline,
  searchOutline, addCircleOutline, createOutline, trashOutline,
  logInOutline, logOutOutline, cashOutline, closeCircleOutline,
  banOutline, checkmarkCircleOutline, statsChartOutline,
  listOutline, peopleOutline, gridOutline, keyOutline,
  cartOutline, alertCircleOutline, chevronBackOutline,
  chevronForwardOutline, trophyOutline, calendarOutline,
  layersOutline, swapHorizontalOutline, shieldCheckmarkOutline,
  analyticsOutline, trashBinOutline
} from 'ionicons/icons';

import { AuditLogService } from '../services/audit.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { AuditRecentWidgetComponent } from '../components/audit-recent-widget/audit-recent-widget.component';
import { AuditLog, AuditStats, AuditGroupCount, AuditTopUser, AuditDayActivity } from '../models/audit.model';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.page.html',
  styleUrls: ['./audit-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonButton, IonIcon, IonLabel, IonBadge,
    IonSpinner, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonSelect, IonSelectOption,
    IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
    HeaderComponent, EmptyStateComponent, AuditRecentWidgetComponent
  ]
})
export class AuditListPage implements OnInit {
  // Estado
  loading = signal(true);
  loadingStats = signal(true);
  activeTab = signal<'stats' | 'logs'>('stats');

  // Stats
  auditStats = signal<AuditStats | null>(null);

  // Logs con filtros
  actionFilter = signal<string>('all');
  moduleFilter = signal<string>('all');
  statusFilter = signal<string>('all');
  currentPage = signal(1);
  totalPages = signal(1);
  totalLogs = signal(0);
  pageSize = 50;

  logs = this.auditService.logs;

  // Cleanup
  cleanupDays = signal(365);
  cleaningUp = signal(false);

  constructor(
    public auditService: AuditLogService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    addIcons({
      timeOutline, personOutline, documentTextOutline,
      searchOutline, addCircleOutline, createOutline, trashOutline,
      logInOutline, logOutOutline, cashOutline, closeCircleOutline,
      banOutline, checkmarkCircleOutline, statsChartOutline,
      listOutline, peopleOutline, gridOutline, keyOutline,
      cartOutline, alertCircleOutline, chevronBackOutline,
      chevronForwardOutline, trophyOutline, calendarOutline,
      layersOutline, swapHorizontalOutline, shieldCheckmarkOutline,
      analyticsOutline, trashBinOutline
    });
  }

  goToReports() {
    this.router.navigate(['/columbarium/audit/reports']);
  }

  goToUserHistory(user: AuditTopUser) {
    this.router.navigate(['/columbarium/audit/user', user._id], {
      queryParams: { name: user.fullName || user.username, role: user.role }
    });
  }

  ngOnInit() {
    this.loadStats();
    this.loadLogs();
  }

  doRefresh(event: any) {
    Promise.all([
      this.auditService.getStats().toPromise(),
      this.loadLogsPromise()
    ]).then(() => event.target.complete())
      .catch(() => event.target.complete());

    this.loadStats();
    this.loadLogs();
    setTimeout(() => event.target.complete(), 3000);
  }

  onTabChange(event: any) {
    this.activeTab.set(event.detail.value);
  }

  // ═══════ STATS ═══════

  loadStats() {
    this.loadingStats.set(true);
    this.auditService.getStats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.auditStats.set(response.data);
        }
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false)
    });
  }

  // Stats computed helpers
  get todayCount(): number {
    const stats = this.auditStats();
    if (!stats?.activityByDay) return 0;
    const today = new Date().toISOString().split('T')[0];
    const todayData = stats.activityByDay.find(d => d._id === today);
    return todayData?.count || 0;
  }

  get errorCount(): number {
    const stats = this.auditStats();
    if (!stats?.byStatus) return 0;
    const errorData = stats.byStatus.find(s => s._id === 'error');
    return errorData?.count || 0;
  }

  get warningCount(): number {
    const stats = this.auditStats();
    if (!stats?.byStatus) return 0;
    const warnData = stats.byStatus.find(s => s._id === 'warning');
    return warnData?.count || 0;
  }

  getModulePercentage(mod: AuditGroupCount): number {
    const stats = this.auditStats();
    if (!stats || stats.total === 0) return 0;
    return Math.round((mod.count / stats.total) * 100);
  }

  getMaxModuleCount(): number {
    const stats = this.auditStats();
    if (!stats?.byModule?.length) return 1;
    return stats.byModule[0].count;
  }

  getBarWidth(count: number): number {
    const max = this.getMaxModuleCount();
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  getDayLabel(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Hoy';
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ayer';

    return date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
  }

  getMaxDayCount(): number {
    const stats = this.auditStats();
    if (!stats?.activityByDay?.length) return 1;
    return Math.max(...stats.activityByDay.map(d => d.count));
  }

  getDayBarHeight(count: number): number {
    const max = this.getMaxDayCount();
    return max > 0 ? Math.max(Math.round((count / max) * 100), 4) : 4;
  }

  getUserMedal(index: number): string {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  }

  // ═══════ LOGS ═══════

  loadLogs() {
    this.loading.set(true);

    const params: any = {
      limit: this.pageSize,
      page: this.currentPage()
    };

    if (this.actionFilter() !== 'all') params.action = this.actionFilter();
    if (this.moduleFilter() !== 'all') params.module = this.moduleFilter();
    if (this.statusFilter() !== 'all') params.status = this.statusFilter();

    this.auditService.getAll(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.totalPages.set(response.pages || 1);
          this.totalLogs.set(response.total || 0);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadLogsPromise(): Promise<void> {
    return new Promise((resolve) => {
      this.loadLogs();
      resolve();
    });
  }

  onActionFilterChange(event: any) {
    this.actionFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
    this.loadLogs();
  }

  onModuleFilterChange(event: any) {
    this.moduleFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
    this.loadLogs();
  }

  onStatusFilterChange(event: any) {
    this.statusFilter.set(event.detail?.value || 'all');
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters() {
    this.actionFilter.set('all');
    this.moduleFilter.set('all');
    this.statusFilter.set('all');
    this.currentPage.set(1);
    this.loadLogs();
  }

  get hasActiveFilters(): boolean {
    return this.actionFilter() !== 'all' || this.moduleFilter() !== 'all' || this.statusFilter() !== 'all';
  }

  // Paginación
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
      this.loadLogs();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
      this.loadLogs();
    }
  }

  // Helpers para logs
  getLogUser(log: AuditLog): string {
    if (typeof log.user === 'object' && log.user?.fullName) {
      return log.user.fullName;
    }
    return log.username || 'Desconocido';
  }

  getLogUserRole(log: AuditLog): string {
    if (typeof log.user === 'object' && log.user?.role) {
      return log.user.role;
    }
    return log.userRole || '';
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

  formatFullDate(timestamp: Date): string {
    return new Date(timestamp).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  get pageRangeStart(): number {
    if (this.totalLogs() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize + 1;
  }

  get pageRangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalLogs());
  }

  // ═══════ CLEANUP ═══════

  onCleanupDaysChange(event: any) {
    const val = parseInt(event.target.value);
    if (val >= 90) this.cleanupDays.set(val);
  }

  async cleanupLogs() {
    const days = this.cleanupDays();
    const confirmed = await this.notificationService.confirm(
      'Limpiar Logs Antiguos',
      `Se eliminarán todos los logs con más de ${days} días de antigüedad. Esta acción no se puede deshacer. ¿Continuar?`
    );

    if (!confirmed) return;

    this.cleaningUp.set(true);
    this.auditService.cleanupOldLogs(days).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.notificationService.success(response.message || 'Logs eliminados exitosamente');
          this.loadStats();
          this.loadLogs();
        }
        this.cleaningUp.set(false);
      },
      error: () => {
        this.notificationService.error('Error al limpiar logs');
        this.cleaningUp.set(false);
      }
    });
  }
}
