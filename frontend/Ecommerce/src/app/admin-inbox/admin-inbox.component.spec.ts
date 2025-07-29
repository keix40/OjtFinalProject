import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminInboxComponent } from './admin-inbox.component';

describe('AdminInboxComponent', () => {
  let component: AdminInboxComponent;
  let fixture: ComponentFixture<AdminInboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminInboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminInboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
