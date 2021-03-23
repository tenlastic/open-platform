import { expect } from 'chai';
import { NamespaceQueueLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';

import { QueueMock } from './model.mock';
import { Queue } from './model';

describe('models/game.model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the queues.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ count: 1 }),
        }),
      });
      await QueueMock.create({ namespaceId: namespace._id });

      const promise = Queue.checkNamespaceLimits(1, namespace._id);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.count. Value: 1.');
    });
  });
});
