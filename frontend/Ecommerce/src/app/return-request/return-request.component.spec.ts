import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnRequestComponent } from './return-request.component';

describe('ReturnRequestComponent', () => {
  let component: ReturnRequestComponent;
  let fixture: ComponentFixture<ReturnRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReturnRequestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
