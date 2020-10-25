import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

import {
  CollectionDocument,
  CollectionMock,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/collections/find-one', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    let record: CollectionDocument;

    beforeEach(async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['collections'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      record = await CollectionMock.create({ namespaceId: namespace._id });
    });

    it('returns the record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    let record: CollectionDocument;

    beforeEach(async function() {
      const namespace = await NamespaceMock.create();
      record = await CollectionMock.create({ namespaceId: namespace._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
