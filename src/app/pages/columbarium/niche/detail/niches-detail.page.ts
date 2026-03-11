import {
  Component, OnInit, OnDestroy, computed, signal,
  ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline, gridOutline, personOutline, layersOutline
} from 'ionicons/icons';

import { NicheService } from '../../services/niche.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { Niche, SectionGroup, ModuleGroup } from '../../models/niche.model';
import { Customer } from '../../models/customer.model';
import { NicheMinimapComponent } from '../minimap/niche-minimap.component';

@Component({
  selector: 'app-niches-detail',
  templateUrl: './niches-detail.page.html',
  styleUrls: ['./niches-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
    IonTitle, IonIcon, IonSpinner,
    EmptyStateComponent,
    NicheMinimapComponent
  ]
})
export class NichesDetailPage implements OnInit, OnDestroy {

  // Points to the INNER scroll container (.nd-scroll-area), not nd-main
  @ViewChild('mainScroll') mainScrollEl?: ElementRef<HTMLElement>;

  loading          = signal(true);
  currentModule    = signal<string>('');
  currentSection   = signal<string>('');
  typeFilter       = signal<'all' | 'wood' | 'marble'>('all');
  highlightedNiche = signal<string | null>(null);

  // ── Viewport state for minimap ─────────────────────────────────────────────
  scrollLeft  = signal(0);
  clientWidth = signal(0);
  scrollWidth = signal(0);

  // Stable references for removeEventListener
  private readonly onScroll = () => this.updateViewport();
  private readonly onResize = () => this.updateViewport();

  // ── Service data ───────────────────────────────────────────────────────────
  niches       = this.nicheService.niches;
  moduleGroups = this.nicheService.moduleGroups;

  // ── Computed ───────────────────────────────────────────────────────────────
  moduleInfo = computed(() =>
    this.moduleGroups().find(m => m.module === this.currentModule())
  );

  availableSections = computed(() => {
    const module = this.moduleInfo();
    return module ? module.sections.map(s => s.section).sort() : [];
  });

  sectionData = computed(() => {
    const module = this.moduleInfo();
    if (!module) return null;
    return module.sections.find(s => s.section === this.currentSection());
  });

  // All section niches sorted — for the minimap (ignores type filter)
  allSectionNiches = computed(() => {
    const section = this.sectionData();
    if (!section) return [];
    return [...section.niches].sort((a, b) =>
      b.row !== a.row ? b.row - a.row : a.number - b.number
    );
  });

  // Filtered + sorted niches for the interactive grid
  filteredNiches = computed(() => {
    const section = this.sectionData();
    if (!section) return [];

    let niches = section.niches;
    const filter = this.typeFilter();
    if (filter !== 'all') niches = niches.filter(n => n.type === filter);

    return [...niches].sort((a, b) =>
      b.row !== a.row ? b.row - a.row : a.number - b.number
    );
  });

  // ── Constructor ────────────────────────────────────────────────────────────
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nicheService: NicheService,
    private notificationService: NotificationService,
  ) {
    addIcons({ informationCircleOutline, gridOutline, personOutline, layersOutline });
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    const module  = this.route.snapshot.paramMap.get('module');
    const section = this.route.snapshot.paramMap.get('section');

    if (!module || !section) {
      this.notificationService.error('Módulo o sección no especificados');
      this.router.navigate(['/columbarium/niches']);
      return;
    }

    this.currentModule.set(module.toUpperCase());
    this.currentSection.set(section.toUpperCase());

    if (this.niches().length === 0) {
      this.loadNiches();
    } else {
      this.loading.set(false);
      this.checkHighlight();
      setTimeout(() => this.setupScrollListener(), 50);
    }
  }

  ngOnDestroy() {
    const el = this.mainScrollEl?.nativeElement;
    if (el) el.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  // ── Data ───────────────────────────────────────────────────────────────────
  loadNiches() {
    this.loading.set(true);
    this.nicheService.getAll({
      module: this.currentModule(),
      section: this.currentSection()
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.checkHighlight();
        setTimeout(() => this.setupScrollListener(), 50);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Error al cargar nichos');
      }
    });
  }

  checkHighlight() {
    const highlight = this.route.snapshot.queryParamMap.get('highlight');
    if (highlight) {
      this.highlightedNiche.set(highlight);
      setTimeout(() => this.highlightedNiche.set(null), 10000);
    }
  }

  // ── Scroll listener ────────────────────────────────────────────────────────
  private setupScrollListener() {
    const el = this.mainScrollEl?.nativeElement;
    if (!el) return;
    this.updateViewport();
    el.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  private updateViewport() {
    const el = this.mainScrollEl?.nativeElement;
    if (!el) return;
    this.scrollLeft.set(el.scrollLeft);
    this.clientWidth.set(el.clientWidth);
    this.scrollWidth.set(el.scrollWidth);
  }

  // ── Minimap handlers ───────────────────────────────────────────────────────

  // Called when minimap emits scrollTo (drag or click-jump) — INSTANT, no animation
  onMinimapScrollTo(targetScrollLeft: number) {
    const el = this.mainScrollEl?.nativeElement;
    if (!el) return;
    el.scrollLeft = targetScrollLeft;
  }

  // Called when minimap emits nicheClick — highlight only, no scroll
  highlightFromMinimap(niche: Niche) {
    this.highlightedNiche.set(niche.code);
    setTimeout(() => this.highlightedNiche.set(null), 3000);
  }

  // Called when clicking a niche in the MAIN grid — full niche detail
  openNicheDetail(niche: Niche) {
    this.router.navigate(['/columbarium/niches', niche._id]);
  }

  // ── Scroll to niche (from minimap nicheClick) ──────────────────────────────
  scrollToNiche(niche: Niche) {
    const el = this.mainScrollEl?.nativeElement;
    if (!el) return;

    // Main grid: cell 52px + gap 6px = 58px step; nd-scroll-area padding 24px + nd-grid-area padding 20px = 44px
    const CELL_STEP = 58;
    const PADDING   = 44;
    const colIndex  = niche.number - 1;
    const cellCenter = PADDING + colIndex * CELL_STEP + CELL_STEP / 2;
    const targetLeft = cellCenter - el.clientWidth / 2;

    el.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    this.highlightedNiche.set(niche.code);
    setTimeout(() => this.highlightedNiche.set(null), 3000);
  }

  // ── Grid helpers ───────────────────────────────────────────────────────────
  getGridColumns(): string {
    const section = this.sectionData();
    if (!section) return 'repeat(10, 1fr)';
    return `repeat(${section.nichesPerRow}, 1fr)`;
  }

  getOwnerName(niche: Niche): string {
    if (niche.currentOwner && typeof niche.currentOwner === 'object') {
      const owner = niche.currentOwner as Customer;
      return `${owner.firstName} ${owner.lastName}`;
    }
    return 'Propietario';
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  goToSection(section: string) {
    this.currentSection.set(section);
    this.router.navigate(
      ['/columbarium/niches/module', this.currentModule(), section],
      { replaceUrl: true }
    );
  }

  setTypeFilter(filter: 'all' | 'wood' | 'marble') {
    this.typeFilter.set(filter);
  }

  goBack() {
    this.router.navigate(['/columbarium/niches']);
  }
}
