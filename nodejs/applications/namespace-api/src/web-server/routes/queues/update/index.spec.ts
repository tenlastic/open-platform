import {
  AuthorizationModel,
  AuthorizationRole,
  BuildModel,
  GameServerTemplateModel,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  QueueDocument,
  QueueModel,
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

describe('web-server/queues/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: UpdateOneContext<QueueDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesRead, AuthorizationRole.QueuesWrite],
        userId: user._id,
      }).save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const gameServerTemplate = await GameServerTemplateModel.mock({
        buildId: build._id,
        namespaceId: namespace._id,
      }).save();
      const queue = await QueueModel.mock({
        cpu: 0.5,
        gameServerTemplateId: gameServerTemplate._id,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
        replicas: 1,
      }).save();

      ctx = ContextMock({
        params: { _id: queue._id, namespaceId: namespace._id },
        request: {
          body: {
            cpu: 1,
            memory: 1 * 1000 * 1000 * 1000,
            name: chance.hash(),
            replicas: 1,
          },
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
      const gameServerTemplate = await GameServerTemplateModel.mock({
        buildId: build._id,
        namespaceId: namespace._id,
      }).save();
      const queue = await QueueModel.mock({
        cpu: 0.5,
        gameServerTemplateId: gameServerTemplate._id,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
        replicas: 1,
      }).save();

      const ctx = ContextMock<UpdateOneContext<QueueDocument>>({
        params: { _id: queue._id, namespaceId: namespace._id },
        request: {
          body: {
            cpu: 1,
            memory: 1 * 1000 * 1000 * 1000,
            name: chance.hash(),
            replicas: 1,
          },
        },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
