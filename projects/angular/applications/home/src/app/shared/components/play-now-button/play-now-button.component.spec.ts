import { RouterMock } from '@app/core/mocks';
import { PatchService, UnityService } from '@app/core/services';
import { PlayNowButtonComponent } from './play-now-button.component';

describe('PlayNowButtonComponent', () => {
  let component: PlayNowButtonComponent;
  let router: RouterMock;

  beforeEach(() => {
    const unityService = new UnityService();
    const patchService = new PatchService(unityService);
    router = new RouterMock();

    component = new PlayNowButtonComponent(
      patchService,
      router as any,
      unityService
    );
  });

  describe('isReady', () => {
    describe('when unityService.isLauncher is false', () => {
      it('returns true', () => {
        component.unityService.isLauncher = false;

        expect(component.isReady).toBe(true);
      });
    });

    describe('when unityService.isLauncher is true', () => {
      it('returns the patchService.isReady value', () => {
        component.unityService.isLauncher = true;
        expect(component.isReady).toBe(false);

        component.patchService.isReady = true;
        expect(component.isReady).toBe(true);
      });
    });
  });

  describe('click()', () => {
    describe('when unityService.isLauncher is true', () => {
      it('emits a play event', () => {
        return new Promise((resolve) => {
          component.unityService.isLauncher = true;

          document.addEventListener('unity', (e: CustomEvent) => {
            expect(e.detail).toEqual({ type: 'play' });

            resolve();
          });

          component.click();
        });
      });
    });

    describe('when unityService.isLauncher is false', () => {
      it('navigates to /play-now', () => {
        component.click();

        expect(router.navigateByUrl).toHaveBeenCalled();
      });
    });
  });
});
