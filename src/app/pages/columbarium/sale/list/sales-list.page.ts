import { Component, OnInit, computed, signal } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonSearchbar, IonSpinner,
  IonFab, IonFabButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add, cashOutline, personOutline, businessOutline,
  searchOutline
} from 'ionicons/icons';

import { SaleService } from '../../services/sale.service';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Sale } from '../../models/sale.model';
import { Customer } from '../../models/customer.model';
import { Niche } from '../../models/niche.model';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.page.html',
  styleUrls: ['./sales-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonContent, IonSearchbar, IonSpinner,
    IonFab, IonFabButton, IonIcon,
    HeaderComponent, EmptyStateComponent, CurrencyMxPipe
  ]
})
export class SalesListPage implements OnInit, ViewWillEnter {
  loading = signal(true);
  searchTerm = signal('');
  statusFilter = signal<'all' | 'active' | 'paid' | 'cancelled' | 'overdue'>('all');

  sales = this.saleService.sales;

  // Computed se recalcula automaticamente
  filteredSales = computed(() => {
    let result = this.sales();

    // Filtro por busqueda (folio o nombre del cliente)
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(s => {
        const customer = s.customer as Customer;
        const niche = s.niche as Niche;

        return s.folio.toLowerCase().includes(search) ||
          customer.firstName?.toLowerCase().includes(search) ||
          customer.lastName?.toLowerCase().includes(search) ||
          niche.code?.toLowerCase().includes(search)
      });
    }

    // Filtro por estado
    const status = this.statusFilter();
    if (status !== 'all') {
      result = result.filter(s => s.status === status);
    }

    return result;
  });

  constructor(
    private saleService: SaleService,
    private router: Router
  ) {
    addIcons({ add, cashOutline, personOutline, businessOutline, searchOutline });
  }

  ngOnInit() {
    this.loadSales();
  }

  ionViewWillEnter() {
    this.saleService.getAll().subscribe();
  }

  loadSales() {
    this.loading.set(true);
    this.saleService.getAll().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  // Cambiar filtro
  onFilterChange(event: any) {
    const value = event.target?.value || 'all';
    this.statusFilter.set(value);
  }

  // Buscar
  onSearch(event: any) {
    const term = event.target?.value || '';
    this.searchTerm.set(term);
  }

  goToDetail(id: string) {
    this.router.navigate(['columbarium/sales', id]);
  }

  goToCreate() {
    this.router.navigate(['columbarium/sales/create']);
  }

  // Helpers
  getStatusColor(status: string): string {
    return this.saleService.getStatusColor(status);
  }

  getStatusLabel(status: string): string {
    return this.saleService.getStatusLabel(status);
  }

  getProgress(sale: Sale): number {
    return this.saleService.calculateProgress(sale);
  }

  getDownPaymentProgress(sale: Sale): number {
    return this.saleService.calculateDownPaymentProgress(sale);
  }

  getInstallmentsProgress(sale: Sale): number {
    return this.saleService.calculateInstallmentsProgress(sale);
  }

  // Safe access para customer y niche
  getCustomerName(sale: Sale): string {
    const customer = sale.customer as Customer;
    return customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
  }

  getNicheCode(sale: Sale): string {
    const niche = sale.niche as Niche;
    return niche?.code || 'N/A';
  }
}
