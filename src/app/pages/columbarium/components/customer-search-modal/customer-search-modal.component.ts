import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSearchbar, IonList, IonItem, IonLabel,
  IonIcon, IonNote, IonAvatar, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, personCircleOutline, callOutline, mailOutline } from 'ionicons/icons';

import { Customer } from '../../models/customer.model';

@Component({
  selector: 'app-customer-search-modal',
  standalone: true,
  templateUrl: './customer-search-modal.component.html',
  styleUrls: ['./customer-search-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonSearchbar, IonList, IonItem, IonLabel,
    IonIcon, IonAvatar
  ]
})
export class CustomerSearchModalComponent {
  @Input() customers: Customer[] = [];

  searchTerm = signal('');

  // Filtrado reactivo
  filteredCustomers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.customers;

    return this.customers.filter(c =>
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.rfc?.toLowerCase().includes(term)
    );
  });

  constructor(private modalCtrl: ModalController) {
    addIcons({ close, personCircleOutline, callOutline, mailOutline });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  selectCustomer(customer: Customer) {
    this.modalCtrl.dismiss({ customer });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
