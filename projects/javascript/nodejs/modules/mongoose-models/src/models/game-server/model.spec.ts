import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceGameServerLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';
import { GameServer } from './model';

use(chaiAsPromised);

describe('models/game-server/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the gameServers.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(null, 2, true, 1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.cpu. Value: 1.',
      );
    });

    it('enforces the gameServers.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ memory: 1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(null, 1, true, 2, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.memory. Value: 1.',
      );
    });

    it('enforces the gameServers.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(null, 1, false, 1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.preemptible. Value: true.',
      );
    });
  });
});
