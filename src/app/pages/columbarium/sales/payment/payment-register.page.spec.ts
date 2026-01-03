import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentRegisterPage } from './payment-register.page';

describe('PaymentRegisterPage', () => {
  let component: PaymentRegisterPage;
  let fixture: ComponentFixture<PaymentRegisterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
