import {
  CollectionDocument,
  CollectionMock,
  NamespaceDocument,
  NamespaceMock,
  NamespaceUserMock,
  RecordSchema,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('handlers/records/find-one', function() {
  let collection: CollectionDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    namespace = await NamespaceMock.create({ users: [namespaceUser] });

    collection = await CollectionMock.create({
      namespaceId: namespace._id,
      permissions: {
        create: {
          default: ['properties'],
        },
        delete: {},
        find: {
          default: {},
        },
        read: {
          default: ['_id', 'createdAt', 'properties', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });
  });

  it('returns the matching record', async function() {
    const Model = RecordSchema.getModel(collection);
    const record = await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      namespaceId: namespace._id,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: {
        _id: record._id.toString(),
        collectionId: collection._id,
        databaseId: collection.databaseId,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
