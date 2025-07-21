import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateDeliveryServiceComponent } from './create-delivery-service.component';

describe('CreateDeliveryServiceComponent', () => {
  let component: CreateDeliveryServiceComponent;
  let fixture: ComponentFixture<CreateDeliveryServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateDeliveryServiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateDeliveryServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
