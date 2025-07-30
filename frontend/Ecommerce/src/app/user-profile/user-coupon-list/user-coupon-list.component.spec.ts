import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCouponListComponent } from './user-coupon-list.component';

describe('UserCouponListComponent', () => {
  let component: UserCouponListComponent;
  let fixture: ComponentFixture<UserCouponListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserCouponListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCouponListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
