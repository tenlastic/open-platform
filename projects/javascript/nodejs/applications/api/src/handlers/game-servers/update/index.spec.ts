import {
  GameServerDocument,
  GameServerMock,
  NamespaceDocument,
  NamespaceMock,
  NamespaceUserMock,
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

describe('handlers/game-servers/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let namespace: NamespaceDocument;
    let record: GameServerDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['game-servers'],
      });

      namespace = await NamespaceMock.create({ users: [namespaceUser] });
      record = await GameServerMock.create({ namespaceId: namespace._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the gameServers.cpu Namespace limit', async function() {
      namespace.limits.gameServers.cpu = 0.1;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            cpu: 0.2,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.cpu. Value: 0.1.',
      );
    });

    it('enforces the gameServers.memory Namespace limit', async function() {
      namespace.limits.gameServers.memory = 0.1;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        request: {
          body: {
            memory: 0.2,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.memory. Value: 0.1.',
      );
    });

    it('enforces the gameServers.preemptible Namespace limit', async function() {
      namespace.limits.gameServers.preemptible = true;
      namespace.markModified('limits');
      await namespace.save();

      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            isPreemptible: false,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'Namespace limit reached: gameServers.preemptible. Value: true.',
      );
    });
  });

  context('when permission is denied', function() {
    let record: GameServerDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await GameServerMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            name: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
