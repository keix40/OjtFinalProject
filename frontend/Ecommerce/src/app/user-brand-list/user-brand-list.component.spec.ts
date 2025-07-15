import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBrandListComponent } from './user-brand-list.component';

describe('UserBrandListComponent', () => {
  let component: UserBrandListComponent;
  let fixture: ComponentFixture<UserBrandListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserBrandListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBrandListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
