import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonIcon, IonBadge,
  IonSearchbar, IonSpinner, IonCard, IonCardContent,
  IonSelect, IonSelectOption,
  IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  peopleOutline, personOutline, searchOutline, shieldOutline,
  timeOutline, ellipsisVerticalOutline, mailOutline, callOutline,
  checkmarkCircleOutline, closeCircleOutline, refreshOutline
} from 'ionicons/icons';

import { AuthService } from 'src/app/core/services/auth.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { User } from 'src/app/core/models/user.model';

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonIcon, IonBadge,
    IonSearchbar, IonSpinner, IonCard, IonCardContent,
    IonSelect, IonSelectOption,
    IonRefresher, IonRefresherContent,
    HeaderComponent, EmptyStateComponent
  ]
})
export class UsersPage implements OnInit {
  loading = signal(true);
  users = signal<User[]>([]);
  searchTerm = signal('');
  roleFilter = signal<string>('all');

  filteredUsers = computed(() => {
    let result = this.users();
    const search = this.searchTerm().toLowerCase().trim();

    if (search) {
      result = result.filter(u =>
        u.fullName.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    if (this.roleFilter() !== 'all') {
      result = result.filter(u => u.role === this.roleFilter());
    }

    return result;
  });

  roleCounts = computed(() => {
    const all = this.users();
    return {
      total: all.length,
      admin: all.filter(u => u.role === 'admin').length,
      seller: all.filter(u => u.role === 'seller').length,
      viewer: all.filter(u => u.role === 'viewer').length
    };
  });

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    addIcons({
      peopleOutline, personOutline, searchOutline, shieldOutline,
      timeOutline, ellipsisVerticalOutline, mailOutline, callOutline,
      checkmarkCircleOutline, closeCircleOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.authService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.users.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.notificationService.error('Error al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  doRefresh(event: any) {
    this.loadUsers();
    setTimeout(() => event.target.complete(), 2000);
  }

  onSearchChange(event: any) {
    this.searchTerm.set(event.detail?.value || '');
  }

  onRoleFilterChange(event: any) {
    this.roleFilter.set(event.detail?.value || 'all');
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'admin': return 'danger';
      case 'seller': return 'primary';
      case 'viewer': return 'medium';
      default: return 'medium';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'seller': return 'Vendedor';
      case 'viewer': return 'Visor';
      default: return role;
    }
  }

  formatLastLogin(date?: Date): string {
    if (!date) return 'Sin actividad';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin < 2) return 'En línea';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  getUserInitials(user: User): string {
    if (!user.fullName) return '?';
    const parts = user.fullName.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  trackByFn(index: number, user: User): string {
    return user.id;
  }
}
