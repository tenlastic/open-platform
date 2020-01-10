import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppModule } from '../../../../app.module';
import { AuthenticationModule } from '../../authentication.module';
import { LogoutPageComponent } from './logout-page.component';

describe('LogoutPage', () => {
  let component: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule, AuthenticationModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
