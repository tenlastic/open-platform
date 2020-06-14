import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppModule } from '../../../../app.module';
import { AuthenticationModule } from '../../authentication.module';
import { RequestPasswordResetPageComponent } from './request-password-reset-page.component';

describe('ResetPasswordPage', () => {
  let component: RequestPasswordResetPageComponent;
  let fixture: ComponentFixture<RequestPasswordResetPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, AuthenticationModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RequestPasswordResetPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
