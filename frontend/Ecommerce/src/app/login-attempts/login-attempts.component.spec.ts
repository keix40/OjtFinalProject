import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginAttemptsComponent } from './login-attempts.component';

describe('LoginAttemptsComponent', () => {
  let component: LoginAttemptsComponent;
  let fixture: ComponentFixture<LoginAttemptsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginAttemptsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginAttemptsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
