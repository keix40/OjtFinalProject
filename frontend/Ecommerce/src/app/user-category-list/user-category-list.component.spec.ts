import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCategoryListComponent } from './user-category-list.component';

describe('UserCategoryListComponent', () => {
  let component: UserCategoryListComponent;
  let fixture: ComponentFixture<UserCategoryListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserCategoryListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
