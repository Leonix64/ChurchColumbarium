import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonBadge } from '@ionic/angular/standalone';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  imports: [IonBadge, CommonModule],
})
export class StatusBadgeComponent {
  @Input() status!: string;

  get color(): string {
    switch (this.status) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'warning';
      case 'sold':
        return 'danger';
      case 'disabled':
        return 'medium';
      default:
        return 'medium';
    }
  }

  get label(): string {
    switch (this.status) {
      case 'available':
        return 'Disponible';
      case 'reserved':
        return 'Reservado';
      case 'sold':
        return 'Vendido';
      case 'disabled':
        return 'Deshabilitado';
      default:
        return this.status;
    }
  }
}