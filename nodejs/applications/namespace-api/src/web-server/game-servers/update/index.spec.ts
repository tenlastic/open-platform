import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import {
  AuthorizationMock,
  AuthorizationRole,
  BuildMock,
  GameServerMock,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/game-servers/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let ctx: ContextMock;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GameServersReadWrite],
        userId: user._id,
      });
      const build = await BuildMock.create({ namespaceId: namespace._id });
      const gameServer = await GameServerMock.create({
        buildId: build._id,
        cpu: 0.5,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
      });

      ctx = new ContextMock({
        params: { _id: gameServer._id, namespaceId: namespace._id },
        request: {
          body: { buildId: build._id, cpu: 1, memory: 1 * 1000 * 1000 * 1000, name: chance.hash() },
        },
        state: { user },
      } as any);
    });

    context('when a Namespace Limit is exceeded', function () {
      it('throws an error', async function () {
        namespace.limits = NamespaceLimitsMock.create({ cpu: 0.5 });
        await namespace.save();

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(NamespaceLimitError);
      });
    });

    context('when a Namespace Limit is not exceeded', function () {
      it('creates a Game Server', async function () {
        await handler(ctx as any);

        expect(ctx.response.body.record).to.exist;
      });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      });
      const gameServer = await GameServerMock.create({
        cpu: 0.5,
        memory: 0.5 * 1000 * 1000 * 1000,
        namespaceId: namespace._id,
      });

      const ctx = new ContextMock({
        params: { _id: gameServer._id, namespaceId: namespace._id },
        request: { body: { cpu: 1, memory: 1 * 1000 * 1000 * 1000, name: chance.hash() } },
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
