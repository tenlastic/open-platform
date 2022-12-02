import {
  AuthorizationModel,
  AuthorizationRole,
  BuildModel,
  NamespaceDocument,
  NamespaceModel,
  NamespaceLimitError,
  NamespaceLimitsModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/queues/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesReadWrite],
        userId: user._id,
      }).save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();

      ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            cpu: 1,
            gameServerTemplate: {
              buildId: build._id,
              cpu: 1,
              memory: 1 * 1000 * 1000 * 1000,
            },
            memory: 1 * 1000 * 1000 * 1000,
            name: chance.hash(),
            replicas: 1,
            teams: 2,
            usersPerTeam: 1,
          },
        },
        state: { user },
      } as any);
    });

    context('when a Namespace Limit is exceeded', function () {
      it('throws an error', async function () {
        namespace.limits = NamespaceLimitsModel.mock({ cpu: 0.5 });
        await namespace.save();

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(NamespaceLimitError);
      });
    });

    context('when a Namespace Limit is not exceeded', function () {
      it('creates a Queue', async function () {
        await handler(ctx as any);

        expect(ctx.response.body.record).to.exist;
      });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();

      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            cpu: 1,
            memory: 1 * 1000 * 1000 * 1000,
            name: chance.hash(),
            replicas: 1,
          },
        },
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
