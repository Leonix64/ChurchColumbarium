import { Component, OnInit, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonList, IonItem, IonLabel, IonAvatar,
  IonIcon, IonBadge, IonSearchbar, IonSegment,
  IonSegmentButton, IonSpinner, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, chevronForwardOutline,
  peopleOutline, add
} from 'ionicons/icons';

import { CustomerService } from '../../services/customer.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customers-list',
  templateUrl: './customers-list.page.html',
  styleUrls: ['./customers-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonList, IonItem, IonLabel, IonAvatar,
    IonIcon, IonBadge, IonSearchbar, IonSegment,
    IonSegmentButton, IonSpinner, IonFab, IonFabButton,
    HeaderComponent, EmptyStateComponent
  ]
})
export class CustomersListPage implements OnInit {
  // Estado
  loading = signal(true);
  searchTerm = signal('');
  statusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Datos
  customers = this.customerService.customers;

  // Computed para filtrado
  filteredCustomers = computed(() => {
    let result = this.customers();

    // Filtro por búsqueda
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(c =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.rfc && c.rfc.toLowerCase().includes(search) ||
        c.phone.includes(search)
      );
    }

    // Filtro por estado
    const status = this.statusFilter();
    if (status === 'active') {
      result = result.filter(c => c.active);
    } else if (status === 'inactive') {
      result = result.filter(c => !c.active);
    }

    return result;
  });

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {
    addIcons({ personCircleOutline, chevronForwardOutline, peopleOutline, add });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.customerService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  onFilterChange(event: any) {
    const value = event.detail?.value || 'all';
    this.statusFilter.set(value);
  }

  onSearch(event: any) {
    const term = event.target.value || '';
    this.searchTerm.set(term);
  }

  goToDetail(id: string) {
    this.router.navigate(['/columbarium/customers', id]);
  }

  goToCreate() {
    this.router.navigate(['/columbarium/customers/create']);
  }
}