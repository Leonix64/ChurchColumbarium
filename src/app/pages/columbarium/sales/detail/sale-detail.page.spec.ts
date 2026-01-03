import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleDetailPage } from './sale-detail.page';

describe('SaleDetailPage', () => {
  let component: SaleDetailPage;
  let fixture: ComponentFixture<SaleDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SaleDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
