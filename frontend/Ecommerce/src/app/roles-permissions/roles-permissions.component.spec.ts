import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesPermissionsComponent } from './roles-permissions.component';

describe('RolesPermissionsComponent', () => {
  let component: RolesPermissionsComponent;
  let fixture: ComponentFixture<RolesPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RolesPermissionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolesPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
