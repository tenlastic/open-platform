import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  CollectionDocument,
  CollectionMock,
  DatabaseDocument,
  DatabaseMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  NamespaceUserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/collections/find-one', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let database: DatabaseDocument;
    let record: CollectionDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      database = await DatabaseMock.create({ namespaceId: namespace._id });
      record = await CollectionMock.create({ databaseId: database._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          databaseName: database.name,
          name: record.name,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let database: DatabaseDocument;
    let record: CollectionDocument;

    beforeEach(async function() {
      database = await DatabaseMock.create();
      record = await CollectionMock.create({ databaseId: database._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          databaseName: database.name,
          name: record.name,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
