import {
  AuthorizationModel,
  AuthorizationRole,
  BuildModel,
  GameServerTemplateModel,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import { handler } from './';

use(chaiAsPromised);

describe('web-server/matches/create', function () {
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
        roles: [AuthorizationRole.MatchesRead, AuthorizationRole.MatchesWrite],
        userId: user._id,
      }).save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const gameServerTemplate = await GameServerTemplateModel.mock({
        buildId: build._id,
        cpu: 0.75,
        memory: 100 * 1000 * 1000,
        namespaceId: namespace._id,
      }).save();

      ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            gameServerTemplateId: gameServerTemplate._id,
            teams: [{ userIds: [user._id] }],
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
      it('creates a Match', async function () {
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
      const gameServerTemplate = await GameServerTemplateModel.mock({
        cpu: 0.1,
        memory: 100 * 1000 * 1000,
        namespaceId: namespace._id,
      }).save();

      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { gameServerTemplateId: gameServerTemplate._id, teams: [] } },
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
