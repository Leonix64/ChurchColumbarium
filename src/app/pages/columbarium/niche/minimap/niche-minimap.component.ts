import {
  Component, Input, Output, EventEmitter,
  ViewChild, ElementRef, HostListener, HostBinding,
  OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Niche } from '../../models/niche.model';

@Component({
  selector: 'app-niche-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './niche-minimap.component.html',
  styleUrls: ['./niche-minimap.component.scss']
})
export class NicheMinimapComponent implements OnChanges {

  @ViewChild('nmScroll') nmScrollRef!: ElementRef<HTMLElement>;
  @ViewChild('gridEl')   gridElRef!:  ElementRef<HTMLElement>;

  @Input({ required: true }) niches: Niche[] = [];
  @Input({ required: true }) nichesPerRow: number = 1;
  @Input() highlightedNiche: string | null = null;

  // Viewport state from parent scroll container
  @Input() scrollLeft: number = 0;
  @Input() clientWidth: number = 0;
  @Input() scrollWidth: number = 0;

  @Output() scrollTo   = new EventEmitter<number>();
  @Output() nicheClick = new EventEmitter<Niche>();

  @HostBinding('class.is-dragging') isDragging = false;

  private dragStartClientX    = 0;
  private dragStartScrollLeft = 0;
  private hasDragged          = false;

  private readonly MINI_CELL = 8;
  private readonly MINI_GAP  = 2;

  // ── Grid geometry ──────────────────────────────────────────────────────────

  get miniGridColumns(): string {
    return `repeat(${this.nichesPerRow}, ${this.MINI_CELL}px)`;
  }

  get totalMiniWidth(): number {
    return this.nichesPerRow * (this.MINI_CELL + this.MINI_GAP) - this.MINI_GAP;
  }

  // ── Viewport rect ──────────────────────────────────────────────────────────

  get vpRectLeft(): number {
    if (!this.scrollWidth) return 0;
    return (this.scrollLeft / this.scrollWidth) * this.totalMiniWidth;
  }

  get vpRectWidth(): number {
    if (!this.scrollWidth) return this.totalMiniWidth;
    return Math.max(8, (this.clientWidth / this.scrollWidth) * this.totalMiniWidth);
  }

  get showViewport(): boolean {
    return this.scrollWidth > this.clientWidth + 4;
  }

  // ── Auto-scroll minimap to keep rect centered ──────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scrollLeft'] || changes['clientWidth'] || changes['scrollWidth']) {
      // Only follow when not user-dragging (drag controls scroll directly)
      if (!this.isDragging) {
        setTimeout(() => this.ensureRectVisible(), 0);
      }
    }
  }

  private ensureRectVisible() {
    const el = this.nmScrollRef?.nativeElement;
    if (!el || !this.showViewport) return;

    const rectCenter = this.vpRectLeft + this.vpRectWidth / 2;
    const targetLeft = rectCenter - el.clientWidth / 2;
    el.scrollLeft = Math.max(0, Math.min(targetLeft, el.scrollWidth - el.clientWidth));
  }

  // ── Drag interaction ───────────────────────────────────────────────────────

  onWrapMouseDown(event: MouseEvent) {
    const gridRect = this.gridElRef.nativeElement.getBoundingClientRect();
    const clickX   = event.clientX - gridRect.left;

    this.hasDragged = false;

    const isOnRect = clickX >= this.vpRectLeft - 2
                  && clickX <= this.vpRectLeft + this.vpRectWidth + 2;

    if (this.showViewport && isOnRect) {
      // Grab the rect → drag mode
      this.isDragging          = true;
      this.dragStartClientX    = event.clientX;
      this.dragStartScrollLeft = this.scrollLeft;
      event.preventDefault();
    } else {
      // Click outside rect → jump (center viewport on click position)
      const maxScroll    = this.scrollWidth - this.clientWidth;
      const ratio        = clickX / this.totalMiniWidth;
      const targetScroll = ratio * this.scrollWidth - this.clientWidth / 2;
      this.scrollTo.emit(Math.max(0, Math.min(targetScroll, maxScroll)));
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const dx = event.clientX - this.dragStartClientX;
    if (Math.abs(dx) > 2) this.hasDragged = true;

    const scale        = this.scrollWidth / this.totalMiniWidth;
    const maxScroll    = this.scrollWidth - this.clientWidth;
    const targetScroll = this.dragStartScrollLeft + dx * scale;

    this.scrollTo.emit(Math.max(0, Math.min(targetScroll, maxScroll)));
    event.preventDefault();
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  // ── Cell interaction ───────────────────────────────────────────────────────

  onCellClick(niche: Niche): void {
    if (!this.hasDragged) {
      this.nicheClick.emit(niche);
    }
  }

  trackByCode(_: number, niche: Niche): string {
    return niche.code;
  }
}
