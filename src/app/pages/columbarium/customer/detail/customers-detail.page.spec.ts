import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomersDetailPage } from './customers-detail.page';

describe('CustomersDetailPage', () => {
  let component: CustomersDetailPage;
  let fixture: ComponentFixture<CustomersDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
