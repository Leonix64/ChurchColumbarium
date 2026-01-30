import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MaintenanceListPage } from './maintenance-list.page';

describe('MaintenanceListPage', () => {
  let component: MaintenanceListPage;
  let fixture: ComponentFixture<MaintenanceListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MaintenanceListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
