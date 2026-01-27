import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSearchbar, IonList, IonItem, IonLabel,
  IonIcon, IonAvatar, IonInfiniteScroll, IonInfiniteScrollContent,
  IonSpinner, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, personCircleOutline, callOutline, mailOutline } from 'ionicons/icons';
import { debounceTime, Subject } from 'rxjs';

import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customer-search-modal',
  standalone: true,
  templateUrl: './customer-search-modal.component.html',
  styleUrls: ['./customer-search-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonSearchbar, IonList, IonItem, IonLabel,
    IonIcon, IonAvatar, IonInfiniteScroll, IonInfiniteScrollContent,
    IonSpinner
  ]
})
export class CustomerSearchModalComponent {
  customers = signal<Customer[]>([]);
  loading = signal(false);
  searchTerm = signal('');

  currentPage = signal(1);
  hasMore = signal(true);

  private searchSubject = new Subject<string>();

  constructor(
    private customerService: CustomerService,
    private modalCtrl: ModalController
  ) {
    addIcons({ close, personCircleOutline, callOutline, mailOutline });

    this.searchSubject.pipe(
      debounceTime(300)
    ).subscribe(term => {
      this.performSearch(term, true);
    });
  }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.performSearch('', true);
  }

  onSearch(event: any) {
    const term = event.target.value || '';
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }

  performSearch(search: string, reset: boolean = false) {
    if (reset) {
      this.currentPage.set(1);
      this.customers.set([]);
      this.hasMore.set(true);
    }

    if (!this.hasMore() && !reset) return;

    this.loading.set(true);
    const page = this.currentPage();

    this.customerService.searchCustomers(search, 20, page).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const current = reset ? [] : this.customers();
          this.customers.set([...current, ...response.data]);
          this.hasMore.set((response.page ?? 0) < (response.pages ?? 0));
        }
        //console.log('Paginacion de clientes:', response);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadMore(event: any) {
    this.currentPage.set(this.currentPage() + 1);
    this.performSearch(this.searchTerm(), false);

    setTimeout(() => {
      event.target.complete();
    }, 500);
  }

  selectCustomer(customer: Customer) {
    this.modalCtrl.dismiss({ customer });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}