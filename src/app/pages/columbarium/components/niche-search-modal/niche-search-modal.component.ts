import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSearchbar, IonList, IonItem, IonLabel,
  IonIcon, IonBadge, IonSegment, IonSegmentButton,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, businessOutline, locationOutline, pricetagOutline } from 'ionicons/icons';

import { Niche } from '../../models/niche.model';
import { NicheService } from '../../services/niche.service';
import { CurrencyMxPipe } from 'src/app/shared/pipes/currency-mx.pipe';

@Component({
  selector: 'app-niche-search-modal',
  standalone: true,
  templateUrl: './niche-search-modal.component.html',
  styleUrls: ['./niche-search-modal.component.scss'],
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonSearchbar, IonList, IonItem, IonLabel,
    IonIcon, IonBadge, IonSegment, IonSegmentButton,
    CurrencyMxPipe
  ]
})
export class NicheSearchModalComponent {
  @Input() niches: Niche[] = [];

  searchTerm = signal('');
  typeFilter = signal<'all' | 'wood' | 'marble'>('all');

  // Filtrado reactivo
  filteredNiches = computed(() => {
    let result = this.niches;

    // Filtro por busqueda
    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter(n =>
        n.code.toLowerCase().includes(term) ||
        n.module.toLowerCase().includes(term) ||
        n.displayNumber.toString().includes(term)
      );
    }

    // Filtro por tipo
    const type = this.typeFilter();
    if (type !== 'all') {
      result = result.filter(n => n.type === type);
    }

    // Ordenar por codigo
    return result.sort((a, b) => a.code.localeCompare(b.code));
  });

  constructor(
    public nicheService: NicheService,
    private modalCtrl: ModalController
  ) {
    addIcons({ close, businessOutline, locationOutline, pricetagOutline });
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value || '');
  }

  onFilterChange(event: any) {
    this.typeFilter.set(event.detail.value);
  }

  selectNiche(niche: Niche) {
    this.modalCtrl.dismiss({ niche });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}