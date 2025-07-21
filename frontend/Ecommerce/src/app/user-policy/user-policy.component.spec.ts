import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPolicyComponent } from './user-policy.component';

describe('UserPolicyComponent', () => {
  let component: UserPolicyComponent;
  let fixture: ComponentFixture<UserPolicyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserPolicyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
