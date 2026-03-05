import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SaleCreatePage } from './sale-create.page';

describe('SaleCreatePage', () => {
  let component: SaleCreatePage;
  let fixture: ComponentFixture<SaleCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SaleCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
