import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditListPage } from './audit-list.page';

describe('AuditListPage', () => {
  let component: AuditListPage;
  let fixture: ComponentFixture<AuditListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
