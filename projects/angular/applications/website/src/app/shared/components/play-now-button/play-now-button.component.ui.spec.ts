
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '@app/core/core.module';
import { SharedModule } from '@app/shared/shared.module';
import { PlayNowButtonComponent } from './play-now-button.component';

describe('PlayNowButtonComponent UI', () => {
  let component: PlayNowButtonComponent;
  let fixture: ComponentFixture<PlayNowButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, RouterTestingModule, SharedModule]
    });

    fixture = TestBed.createComponent(PlayNowButtonComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  describe('button', () => {
    describe('when isReady is true', () => {
      it('displays "Play Now"', () => {
        const button = fixture.debugElement.query(By.css('button'));
        expect(button.nativeElement.textContent).toContain('Play Now');
      });
    });

    describe('when isReady is false', () => {
      beforeEach(() => {
        component.unityService.isLauncher = true;
        fixture.detectChanges();
      });

      it('displays "Updating..."', () => {
        const button = fixture.debugElement.query(By.css('button'));
        expect(button.nativeElement.textContent).toContain('Updating...');
      });

      it('is disabled', () => {
        const button = fixture.debugElement.query(By.css('button'));
        expect(button.nativeElement.getAttribute('disabled')).toBe('');
      });
    });
  });
});
