import { expect } from 'chai';
import { NamespaceQueueLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';

import { QueueMock } from './model.mock';
import { Queue } from './model';

describe('models/queue/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the queues.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ count: 1 }),
        }),
      });
      await QueueMock.create({ namespaceId: namespace._id });

      const promise = Queue.checkNamespaceLimits(1, 0.1, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.count. Value: 1.');
    });

    it('enforces the queues.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ cpu: 0.1 }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(0, 0.2, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 0.1.');
    });

    it('enforces the queues.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ memory: 0.1 }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(0, 0.1, true, 0.2, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.memory. Value: 0.1.',
      );
    });

    it('enforces the queues.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(0, 0.1, false, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.preemptible. Value: true.',
      );
    });
  });
});
