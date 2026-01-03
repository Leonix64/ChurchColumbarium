import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NichesManagePage } from './niches-manage.page';

describe('NichesManagePage', () => {
  let component: NichesManagePage;
  let fixture: ComponentFixture<NichesManagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NichesManagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
