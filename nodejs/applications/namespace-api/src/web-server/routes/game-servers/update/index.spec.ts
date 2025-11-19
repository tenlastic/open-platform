import {
  AuthorizationModel,
  AuthorizationRole,
  BuildModel,
  GameServerDocument,
  GameServerModel,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError, UpdateOneContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/game-servers/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: UpdateOneContext<GameServerDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GameServersRead, AuthorizationRole.GameServersWrite],
        userId: user._id,
      }).save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const gameServer = await GameServerModel.mock({
        buildId: build._id,
        cpu: 0.5,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
      }).save();

      ctx = ContextMock({
        params: { _id: gameServer._id, namespaceId: namespace._id },
        request: {
          body: { buildId: build._id, cpu: 1, memory: 1 * 1000 * 1000 * 1000, name: chance.hash() },
        },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    context('when a Namespace Limit is exceeded', function () {
      it('throws an error', async function () {
        namespace.limits = NamespaceLimitsModel.mock({ cpu: 0.5 });
        await namespace.save();

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith(NamespaceLimitError);
      });
    });

    context('when a Namespace Limit is not exceeded', function () {
      it('creates a Game Server', async function () {
        await handler(ctx);

        expect(ctx.response.body.record).to.exist;
      });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const gameServer = await GameServerModel.mock({
        buildId: build._id,
        cpu: 0.5,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
      }).save();

      const ctx = ContextMock<UpdateOneContext<GameServerDocument>>({
        params: { _id: gameServer._id, namespaceId: namespace._id },
        request: { body: { cpu: 1, memory: 1 * 1000 * 1000 * 1000, name: chance.hash() } },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
