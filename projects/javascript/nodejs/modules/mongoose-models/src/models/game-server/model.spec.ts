import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { NamespaceGameServerLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';
import { GameServerMock } from './model.mock';
import { GameServer } from './model';

use(chaiAsPromised);

describe('models/game-server/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the gameServers.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ count: 1 }),
        }),
      });
      await GameServerMock.create({ namespaceId: namespace._id });

      const promise = GameServer.checkNamespaceLimits(1, 0.1, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.count. Value: 1.',
      );
    });

    it('enforces the gameServers.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 0.1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.2, true, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.cpu. Value: 0.1.',
      );
    });

    it('enforces the gameServers.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ memory: 0.1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.1, true, 0.2, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.memory. Value: 0.1.',
      );
    });

    it('enforces the gameServers.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.1, false, 0.1, namespace._id);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.preemptible. Value: true.',
      );
    });
  });
});
