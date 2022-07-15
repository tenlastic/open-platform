import {
  AuthorizationMock,
  AuthorizationRole,
  GameAccess,
  GameDocument,
  GameMock,
  NamespaceDocument,
  NamespaceMock,
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

describe('handlers/games/update', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    let namespace: NamespaceDocument;
    let record: GameDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.GamesReadWrite],
        userId: user._id,
      });

      record = await GameMock.create({ namespaceId: namespace._id });
    });

    it('returns the record', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            title: chance.hash(),
          },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('enforces the Namespace limits', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            access: GameAccess.Public,
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Namespace limit reached: games.public. Value: 0.');
    });
  });

  context('when permission is denied', function () {
    let record: GameDocument;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      record = await GameMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            title: chance.hash(),
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
