import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NichesGridPage } from './niches-grid.page';

describe('NichesGridPage', () => {
  let component: NichesGridPage;
  let fixture: ComponentFixture<NichesGridPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NichesGridPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
