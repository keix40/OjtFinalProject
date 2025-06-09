import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAttributeValueComponent } from './create-attribute-value.component';

describe('CreateAttributeValueComponent', () => {
  let component: CreateAttributeValueComponent;
  let fixture: ComponentFixture<CreateAttributeValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateAttributeValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAttributeValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
