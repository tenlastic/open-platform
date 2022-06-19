import { expect } from 'chai';

import { NamespaceQueueLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';
import { Queue } from './model';

describe('models/queue/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the queues.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ cpu: 1 }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(null, 2, 1, namespace._id, true, 1);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 1.');
    });

    it('enforces the queues.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ memory: 1 }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(null, 1, 2, namespace._id, true, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.memory. Value: 1.',
      );
    });

    it('enforces the queues.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(null, 1, 1, namespace._id, false, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.preemptible. Value: true.',
      );
    });

    it('enforces the queues.replicas Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ replicas: 1 }),
        }),
      });

      const promise = Queue.checkNamespaceLimits(null, 1, 1, namespace._id, true, 2);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: queues.replicas. Value: 1.',
      );
    });
  });
});
