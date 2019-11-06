import { UnityService } from './unity.service';

describe('UnityService', () => {
  let service: UnityService;

  beforeEach(() => {
    service = new UnityService();
  });

  describe('on unity event', () => {
    it('sets isLauncher to true', () => {
      const event = new CustomEvent('unity', { detail: { data: 'Ready', type: 'statusMessage' } });
      document.dispatchEvent(event);

      expect(service.isLauncher).toBe(true);
    });

    it('emits the detail payload', () => {
      const spy = spyOn(service.event, 'emit');

      const detail = { data: 'Ready', type: 'statusMessage' };
      const event = new CustomEvent('unity', { detail });
      document.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith(detail);
    });
  });

  describe('emit', () => {
    it('emits a unity event with the given payload', () => {
      return new Promise((resolve) => {
        const detail = { type: 'play' };

        document.addEventListener('unity', (e: CustomEvent) => {
          expect(e.detail).toEqual(detail);

          return resolve();
        });

        service.emit(detail as any);
      });
    });
  });
});
