import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaintenanceRegisterPage } from './maintenance-register.page';

describe('MaintenanceRegisterPage', () => {
  let component: MaintenanceRegisterPage;
  let fixture: ComponentFixture<MaintenanceRegisterPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceRegisterPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
