import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import {
  GameDocument,
  GameMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/releases/update', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let game: GameDocument;
    let record: ReleaseDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
      game = await GameMock.create({ namespaceId: namespace._id });
      record = await ReleaseMock.create({ gameId: game._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            entrypoint: chance.hash(),
            gameId: game._id,
            version: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let game: GameDocument;
    let record: ReleaseDocument;

    beforeEach(async function() {
      game = await GameMock.create();
      record = await ReleaseMock.create({ gameId: game._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        request: {
          body: {
            entrypoint: chance.hash(),
            gameId: game._id,
            version: chance.hash(),
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});