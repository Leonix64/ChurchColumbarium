import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomersFormPage } from './customers-form.page';

describe('CustomersFormPage', () => {
  let component: CustomersFormPage;
  let fixture: ComponentFixture<CustomersFormPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomersFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
