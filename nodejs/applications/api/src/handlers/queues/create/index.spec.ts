import {
  AuthorizationMock,
  AuthorizationRole,
  BuildMock,
  GameServerTemplateMock,
  NamespaceQueueLimitsMock,
  NamespaceLimitsMock,
  NamespaceMock,
  QueueMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/queues/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesReadWrite],
        userId: user._id,
      });
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            gameServerTemplate: GameServerTemplateMock.create({ buildId: build._id }),
            memory: 100 * 1000 * 1000,
            name: chance.hash(),
            namespaceId: namespace._id,
            replicas: 1,
            teams: 2,
            usersPerTeam: 1,
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function () {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          queues: NamespaceQueueLimitsMock.create({ cpu: 1 }),
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesReadWrite],
        userId: user._id,
      });
      await QueueMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            memory: 1,
            namespaceId: namespace._id,
            replicas: 2,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: queues.cpu. Value: 1.');
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            cpu: 1,
            memory: 1,
            namespaceId: namespace._id,
            replicas: 2,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
