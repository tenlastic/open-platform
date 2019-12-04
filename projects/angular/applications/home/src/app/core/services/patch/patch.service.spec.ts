import * as Chance from 'chance';

import { PatchService } from './patch.service';
import { UnityService } from '../unity/unity.service';

const chance = new Chance();

describe('PatchService', () => {
  let service: PatchService;
  let unityService: UnityService;

  beforeEach(() => {
    unityService = new UnityService();

    service = new PatchService(unityService);
  });

  describe('on UnityService event', () => {
    describe('when the event type is error', () => {
      it('sets error to the event data', () => {
        const data = chance.hash();
        unityService.event.emit({ data, type: 'error'});

        expect(service.error).toBe(data);
      });
    });

    describe('when the event type is fileCount', () => {
      it('sets fileCount to the event data', () => {
        const data = chance.integer();
        unityService.event.emit({ data, type: 'fileCount'});

        expect(service.fileCount).toBe(data);
      });
    });

    describe('when the event type is fileMessage', () => {
      it('sets fileMessage to the event data', () => {
        const data = chance.hash();
        unityService.event.emit({ data, type: 'fileMessage'});

        expect(service.fileMessage).toBe(data);
      });
    });

    describe('when the event type is fileProgress', () => {
      it('sets fileProgress to the event data', () => {
        const data = chance.integer();
        unityService.event.emit({ data, type: 'fileProgress'});

        expect(service.fileProgress).toBe(data);
      });
    });

    describe('when the event type is statusMessage', () => {
      it('sets statusMessage to the event data', () => {
        const data = chance.hash();
        unityService.event.emit({ data, type: 'statusMessage'});

        expect(service.statusMessage).toBe(data);
      });

      describe('when the message is "Update complete."', () => {
        it('sets isReady to true', () => {
          const data = 'Update complete.';
          unityService.event.emit({ data, type: 'statusMessage'});

          expect(service.isReady).toBe(true);
        });
      });
    });

    describe('when the event type is totalFileCount', () => {
      it('sets totalFileCount to the event data', () => {
        const data = chance.integer();
        unityService.event.emit({ data, type: 'totalFileCount'});

        expect(service.totalFileCount).toBe(data);
      });
    });
  });
});
