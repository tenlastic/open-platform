import {
  CollectionDocument,
  CollectionMock,
  NamespaceMock,
  NamespaceUserMock,
  RecordSchema,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('routes/records/count', function () {
  let collection: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

    collection = await CollectionMock.create({
      jsonSchema: {
        type: 'object',
      },
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

  it('returns the number of matching records', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      namespaceId: collection.namespaceId,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: {
        collectionId: collection._id,
        databaseId: collection.databaseId,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
