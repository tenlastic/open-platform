import {
  CollectionMock,
  NamespaceBuildLimitsMock,
  NamespaceCollectionLimits,
  NamespaceGameLimitsMock,
  NamespaceGameServerLimitsMock,
  NamespaceLimitError,
  NamespaceLimits,
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

describe('handlers/collections/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when too many collections exist', function() {
    it('throws a NamespaceLimitError', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['collections'],
      });
      const namespace = await NamespaceMock.create({
        limits: new NamespaceLimits({
          builds: new NamespaceBuildLimitsMock(),
          collections: new NamespaceCollectionLimits({ count: 1 }),
          gameServers: new NamespaceGameServerLimitsMock(),
          games: new NamespaceGameLimitsMock(),
        }),
        users: [namespaceUser],
      });
      await CollectionMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when few enough collections exist', function() {
    context('when permission is granted', function() {
      it('creates a new record', async function() {
        const namespaceUser = NamespaceUserMock.create({
          _id: user._id,
          roles: ['collections'],
        });
        const namespace = await NamespaceMock.create({ users: [namespaceUser] });

        const ctx = new ContextMock({
          request: {
            body: {
              name: chance.hash(),
              namespaceId: namespace._id,
            },
          },
          state: { user },
        });

        await handler(ctx as any);

        expect(ctx.response.body.record).to.exist;
      });
    });

    context('when permission is denied', function() {
      it('throws an error', async function() {
        const namespace = await NamespaceMock.create();

        const ctx = new ContextMock({
          request: {
            body: {
              name: chance.hash(),
              namespaceId: namespace._id,
            },
          },
          state: { user },
        });

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejected;
      });
    });
  });
});
