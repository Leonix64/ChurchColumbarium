import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge,
  IonSearchbar, IonSegment, IonSegmentButton, IonSpinner,
  IonChip, IonNote, IonCard, IonCardContent, IonCardHeader,
  IonCardTitle, IonInfiniteScroll, IonInfiniteScrollContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, personOutline, documentTextOutline,
  filterOutline, searchOutline, addCircleOutline,
  createOutline, trashOutline, logInOutline, logOutOutline,
  cashOutline, closeCircleOutline, banOutline, checkmarkCircleOutline
} from 'ionicons/icons';

import { AuditLogService } from '../services/audit.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { AuditLog, AuditAction, AuditEntity } from '../models/audit.model';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.page.html',
  styleUrls: ['./audit-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonList, IonItem, IonLabel, IonBadge,
    IonSearchbar, IonSegment, IonSegmentButton, IonSpinner,
    IonChip, IonNote, IonCard, IonCardContent, IonCardHeader,
    IonCardTitle, IonInfiniteScroll, IonInfiniteScrollContent,
    HeaderComponent, EmptyStateComponent
  ]
})
export class AuditListPage implements OnInit {
  loading = signal(true);
  searchTerm = signal('');
  actionFilter = signal<AuditAction | 'all'>('all');
  entityFilter = signal<AuditEntity | 'all'>('all');

  // Paginación
  currentPage = signal(1);
  hasMore = signal(true);

  logs = this.auditService.logs;

  // Filtros disponibles
  actionFilters: { value: AuditAction | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'create', label: 'Crear' },
    { value: 'update', label: 'Actualizar' },
    { value: 'delete', label: 'Eliminar' },
    { value: 'payment', label: 'Pago' },
    { value: 'cancel', label: 'Cancelar' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' }
  ];

  entityFilters: { value: AuditEntity | 'all'; label: string }[] = [
    { value: 'all', label: 'Todas' },
    { value: 'customer', label: 'Clientes' },
    { value: 'niche', label: 'Nichos' },
    { value: 'sale', label: 'Ventas' },
    { value: 'payment', label: 'Pagos' },
    { value: 'user', label: 'Usuarios' }
  ];

  constructor(
    public auditService: AuditLogService
  ) {
    addIcons({
      timeOutline, personOutline, documentTextOutline,
      filterOutline, searchOutline, addCircleOutline,
      createOutline, trashOutline, logInOutline, logOutOutline,
      cashOutline, closeCircleOutline, banOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading.set(true);

    const params: any = {
      limit: 50,
      page: this.currentPage()
    };

    if (this.actionFilter() !== 'all') {
      params.action = this.actionFilter();
    }

    if (this.entityFilter() !== 'all') {
      params.entity = this.entityFilter();
    }

    this.auditService.getAll(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.hasMore.set((response.page ?? 0) < (response.pages ?? 0));
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onActionFilterChange(event: any) {
    this.actionFilter.set(event.detail.value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  onEntityFilterChange(event: any) {
    this.entityFilter.set(event.detail.value);
    this.currentPage.set(1);
    this.loadLogs();
  }

  loadMore(event: any) {
    this.currentPage.set(this.currentPage() + 1);
    this.loadLogs();

    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  // Helpers
  getActionColor(action: string): string {
    return this.auditService.getActionColor(action);
  }

  getActionLabel(action: string): string {
    return this.auditService.getActionLabel(action);
  }

  getEntityLabel(entity: string): string {
    return this.auditService.getEntityLabel(entity);
  }

  getActionIcon(action: string): string {
    return this.auditService.getActionIcon(action);
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
}