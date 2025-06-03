import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPaymentMethodsComponent } from './user-payment-methods.component';

describe('UserPaymentMethodsComponent', () => {
  let component: UserPaymentMethodsComponent;
  let fixture: ComponentFixture<UserPaymentMethodsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserPaymentMethodsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPaymentMethodsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
