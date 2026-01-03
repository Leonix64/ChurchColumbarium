import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NichesDetailPage } from './niches-detail.page';

describe('NichesDetailPage', () => {
  let component: NichesDetailPage;
  let fixture: ComponentFixture<NichesDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NichesDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
