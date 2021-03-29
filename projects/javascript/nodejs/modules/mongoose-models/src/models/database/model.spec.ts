import { expect } from 'chai';
import { NamespaceDatabaseLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';

import { DatabaseMock } from './model.mock';
import { Database } from './model';

describe('models/database/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the databases.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ count: 1 }),
        }),
      });
      await DatabaseMock.create({ namespaceId: namespace._id });

      const promise = Database.checkNamespaceLimits(1, 0.1, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.count. Value: 1.',
      );
    });

    it('enforces the databases.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ cpu: 0.1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(0, 0.2, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.cpu. Value: 0.1.',
      );
    });

    it('enforces the databases.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ memory: 0.1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(0, 0.1, true, 0.2, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.memory. Value: 0.1.',
      );
    });

    it('enforces the databases.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = Database.checkNamespaceLimits(0, 0.1, false, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.preemptible. Value: true.',
      );
    });
  });
});
