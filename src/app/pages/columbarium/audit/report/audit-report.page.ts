import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonButton, IonIcon, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonSpinner, IonBadge,
  IonRefresher, IonRefresherContent, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, statsChartOutline, downloadOutline,
  personOutline, layersOutline, trendingUpOutline,
  searchOutline, documentTextOutline, timeOutline,
  constructOutline
} from 'ionicons/icons';

import { AuditLogService } from '../../services/audit.service';
import { AuditReportRawItem, AuditReportProcessed, AuditReportTimelineItem } from '../../models/audit.model';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { NotificationService } from 'src/app/core/services/notification.service';

@Component({
  selector: 'app-audit-report',
  templateUrl: './audit-report.page.html',
  styleUrls: ['./audit-report.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonButton, IonIcon, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonSpinner, IonBadge,
    IonRefresher, IonRefresherContent, IonNote,
    HeaderComponent
  ]
})
export class AuditReportPage {
  // Filtros
  startDate = signal(this.getDefaultStartDate());
  endDate = signal(this.getDefaultEndDate());
  groupBy = signal<'hour' | 'day' | 'week' | 'month'>('day');

  // Estado
  loading = signal(false);
  report = signal<AuditReportProcessed | null>(null);
  generated = signal(false);

  groupByOptions: { value: string; label: string }[] = [
    { value: 'hour', label: 'Hora' },
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' }
  ];

  constructor(
    public auditService: AuditLogService,
    private notificationService: NotificationService
  ) {
    addIcons({
      calendarOutline, statsChartOutline, downloadOutline,
      personOutline, layersOutline, trendingUpOutline,
      searchOutline, documentTextOutline, timeOutline,
      constructOutline
    });
  }

  generateReport() {
    this.loading.set(true);
    this.auditService.getReport({
      startDate: this.startDate(),
      endDate: this.endDate(),
      groupBy: this.groupBy()
    }).subscribe({
      next: (response: any) => {
        const rawData = response.data;

        if (response.success && rawData && rawData.length > 0) {
          const processed = this.processRawData(rawData);
          this.report.set(processed);
          this.generated.set(true);
        } else {
          // Sin datos
          this.report.set({
            totalActions: 0,
            averagePerGroup: 0,
            mostUsedModule: null,
            timeline: []
          });
          this.generated.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al generar reporte');
      }
    });
  }

  /**
   * Procesa los datos crudos del backend en el formato que necesita la UI.
   * El backend devuelve: [{ _id: { date, module, action }, count }]
   * Nosotros necesitamos: timeline agrupada por fecha, totales, etc.
   */
  private processRawData(rawData: AuditReportRawItem[]): AuditReportProcessed {
    // Calcular total de acciones
    const totalActions = rawData.reduce((sum, item) => sum + item.count, 0);

    // Agrupar por fecha para el timeline
    const timelineMap = new Map<string, number>();
    rawData.forEach(item => {
      const date = item._id.date;
      timelineMap.set(date, (timelineMap.get(date) || 0) + item.count);
    });

    const timeline: AuditReportTimelineItem[] = Array.from(timelineMap.entries())
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => a._id.localeCompare(b._id));

    // Promedio por grupo
    const averagePerGroup = timeline.length > 0 ? totalActions / timeline.length : 0;

    // Módulo más usado
    const moduleMap = new Map<string, number>();
    rawData.forEach(item => {
      const mod = item._id.module;
      moduleMap.set(mod, (moduleMap.get(mod) || 0) + item.count);
    });

    let mostUsedModule: { module: string; count: number } | null = null;
    let maxModCount = 0;
    moduleMap.forEach((count, module) => {
      if (count > maxModCount) {
        maxModCount = count;
        mostUsedModule = { module, count };
      }
    });

    return {
      totalActions,
      averagePerGroup,
      mostUsedModule,
      timeline
    };
  }

  onStartDateChange(event: any) {
    this.startDate.set(event.target.value);
  }

  onEndDateChange(event: any) {
    this.endDate.set(event.target.value);
  }

  onGroupByChange(value: string) {
    this.groupBy.set(value as any);
  }

  exportPdf() {
    this.notificationService.warning('Exportar a PDF está en desarrollo');
  }

  exportExcel() {
    this.notificationService.warning('Exportar a Excel está en desarrollo');
  }

  // Helpers
  getMaxTimelineCount(): number {
    const r = this.report();
    if (!r?.timeline?.length) return 1;
    return Math.max(...r.timeline.map(t => t.count));
  }

  getBarHeight(count: number): number {
    const max = this.getMaxTimelineCount();
    return max > 0 ? Math.max(Math.round((count / max) * 100), 4) : 4;
  }

  formatTimelineLabel(id: string): string {
    const group = this.groupBy();

    if (group === 'hour') {
      // El backend devuelve "2026-02-11 14:00"
      const parts = id.split(' ');
      return parts.length > 1 ? parts[1] : id;
    }
    if (group === 'day') {
      const date = new Date(id + 'T12:00:00');
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    }
    if (group === 'week') {
      return `Sem ${id.split('W')[1] || id}`;
    }
    if (group === 'month') {
      const parts = id.split('-');
      const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
    }
    return id;
  }

  getModuleLabel(mod: string): string {
    return this.auditService.getModuleLabel(mod);
  }

  private getDefaultStartDate(): string {
    const d = new Date();
    d.setDate(1); // primer día del mes
    return d.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  doRefresh(event: any) {
    if (this.generated()) {
      this.generateReport();
    }
    setTimeout(() => event.target.complete(), 1000);
  }
}
