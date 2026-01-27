import { Component, Input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonSearchbar, IonList, IonItem, IonLabel,
  IonIcon, IonBadge, IonSegment, IonSegmentButton,
  IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, businessOutline, locationOutline, pricetagOutline } from 'ionicons/icons';
import { debounceTime, Subject } from 'rxjs';

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
    IonInfiniteScroll, IonInfiniteScrollContent, IonSpinner,
    CurrencyMxPipe
  ]
})
export class NicheSearchModalComponent implements OnInit {
  niches = signal<Niche[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  typeFilter = signal<'all' | 'wood' | 'marble'>('all');

  // Paginacion
  currentPage = signal(1);
  hasMore = signal(true);

  private searchSubject = new Subject<string>();

  constructor(
    public nicheService: NicheService,
    private modalCtrl: ModalController
  ) {
    addIcons({ close, businessOutline, locationOutline, pricetagOutline });

    // Debounce search
    this.searchSubject.pipe(debounceTime(300)).subscribe(
      term => {
        this.performSearch(term, true);
      }
    );
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

  onFilterChange(event: any) {
    this.typeFilter.set(event.detail.value);
    this.performSearch(this.searchTerm(), true);
  }

  performSearch(search: string, reset: boolean = false) {
    if (reset) {
      this.currentPage.set(1);
      this.niches.set([]);
      this.hasMore.set(true);
    }

    if (!this.hasMore() && !reset) return;

    this.loading.set(true);
    const page = this.currentPage();
    const type = this.typeFilter() !== 'all' ? this.typeFilter() : undefined;

    this.nicheService.searchNiches(search, type, 20, page).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const current = reset ? [] : this.niches();
          this.niches.set([...current, ...response.data]);
          this.hasMore.set((response.page ?? 0) < (response.pages ?? 0));
        }
        //console.log('Paginacion de nichos:', response);
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

  selectNiche(niche: Niche) {
    this.modalCtrl.dismiss({ niche });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
