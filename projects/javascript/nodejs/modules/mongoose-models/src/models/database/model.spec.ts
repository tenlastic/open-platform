import { expect } from 'chai';
import { NamespaceDatabaseLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';

import { DatabaseMock } from './model.mock';
import { Database } from './model';

describe('models/database/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the databases.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ cpu: 1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(null, 2, 1, namespace._id, true, 1, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.cpu. Value: 1.',
      );
    });

    it('enforces the databases.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ memory: 1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(null, 1, 2, namespace._id, true, 1, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.memory. Value: 1.',
      );
    });

    it('enforces the databases.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = Database.checkNamespaceLimits(null, 1, 1, namespace._id, false, 1, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.preemptible. Value: true.',
      );
    });

    it('enforces the databases.replicas Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ replicas: 1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(null, 1, 1, namespace._id, true, 2, 1);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.replicas. Value: 1.',
      );
    });

    it('enforces the databases.storage Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          databases: NamespaceDatabaseLimitsMock.create({ storage: 1 }),
        }),
      });

      const promise = Database.checkNamespaceLimits(null, 1, 1, namespace._id, true, 1, 2);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: databases.storage. Value: 1.',
      );
    });
  });
});
