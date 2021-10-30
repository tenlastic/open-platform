import {
  ArticlePermissions,
  GameMock,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { ContextMock } from '../../context';
import { create } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', function () {
    it('creates a new record', async function () {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['articles'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const game = await GameMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: {
            body: chance.hash(),
            gameId: game._id,
            namespaceId: namespace._id,
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const handler = create(ArticlePermissions);
      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            body: chance.hash(),
            title: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const handler = create(ArticlePermissions);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
