import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VipCustomersComponent } from './vip-customers.component';

describe('VipCustomersComponent', () => {
  let component: VipCustomersComponent;
  let fixture: ComponentFixture<VipCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VipCustomersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VipCustomersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
