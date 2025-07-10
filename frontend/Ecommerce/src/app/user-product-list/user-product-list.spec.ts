import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserProductListComponent } from './user-product-list';



describe('UserProductListComponent', () => {
  let component: UserProductListComponent;
  let fixture: ComponentFixture<UserProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserProductListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
