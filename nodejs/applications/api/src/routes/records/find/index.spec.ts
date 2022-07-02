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

describe('routes/records/find', function () {
  let collection: CollectionDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: ['databases'],
    });
    namespace = await NamespaceMock.create({ users: [namespaceUser] });

    collection = await CollectionMock.create({
      jsonSchema: {
        properties: {
          insertedAt: { format: 'date-time', type: 'string' },
        },
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

  it('returns the matching records', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      namespaceId: namespace._id,
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

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });

  it('properly handles Dates', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      namespaceId: namespace._id,
      properties: {
        insertedAt: new Date().toISOString(),
      },
      userId: user._id,
    });

    const ONE_HOUR = 60 * 60 * 1000;
    const ctx = new ContextMock({
      params: {
        collectionId: collection._id,
        databaseId: collection.databaseId,
      },
      request: {
        query: {
          where: {
            'properties.insertedAt': {
              $gt: new Date(new Date().getTime() - ONE_HOUR),
            },
          },
        },
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
