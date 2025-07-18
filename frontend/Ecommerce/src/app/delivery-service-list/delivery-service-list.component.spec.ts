import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryServiceListComponent } from './delivery-service-list.component';

describe('DeliveryServiceListComponent', () => {
  let component: DeliveryServiceListComponent;
  let fixture: ComponentFixture<DeliveryServiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliveryServiceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryServiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
