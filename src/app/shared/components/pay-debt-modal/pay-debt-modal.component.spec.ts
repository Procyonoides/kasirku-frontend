import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayDebtModalComponent } from './pay-debt-modal.component';

describe('PayDebtModalComponent', () => {
  let component: PayDebtModalComponent;
  let fixture: ComponentFixture<PayDebtModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayDebtModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PayDebtModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
