import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryAddSubcategoryComponent } from './category-add-subcategory.component';

describe('CategoryAddSubcategoryComponent', () => {
  let component: CategoryAddSubcategoryComponent;
  let fixture: ComponentFixture<CategoryAddSubcategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CategoryAddSubcategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryAddSubcategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
