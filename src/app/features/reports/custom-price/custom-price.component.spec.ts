import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomPriceComponent } from './custom-price.component';

describe('CustomPriceComponent', () => {
  let component: CustomPriceComponent;
  let fixture: ComponentFixture<CustomPriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomPriceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CustomPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
