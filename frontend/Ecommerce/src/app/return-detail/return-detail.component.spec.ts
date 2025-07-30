import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnDetailComponent } from './return-detail.component';

describe('ReturnDetailComponent', () => {
  let component: ReturnDetailComponent;
  let fixture: ComponentFixture<ReturnDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReturnDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
