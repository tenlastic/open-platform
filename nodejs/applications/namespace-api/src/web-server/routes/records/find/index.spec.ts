import {
  Collection,
  CollectionDocument,
  CollectionModelPermissions,
  Namespace,
  NamespaceDocument,
  RecordSchema,
  User,
  UserDocument,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/records/find', function () {
  let collection: CollectionDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock().save();
    namespace = await Namespace.mock().save();
    collection = await Collection.mock({
      jsonSchema: {
        properties: {
          insertedAt: { format: 'date-time', type: 'string' },
        },
        type: 'object',
      },
      namespaceId: namespace._id,
      permissions: CollectionModelPermissions.mock({
        create: new Map(Object.entries({ public: ['properties'] })),
        find: new Map(Object.entries({ public: {} })),
        read: new Map(Object.entries({ public: ['_id', 'createdAt', 'properties', 'updatedAt'] })),
        roles: new Map(Object.entries({ public: {} })),
      }),
    }).save();
  });

  it('returns the matching records', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: { collectionId: collection._id },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });

  it('properly handles Dates', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      properties: { insertedAt: new Date().toISOString() },
      userId: user._id,
    });

    const ONE_HOUR = 60 * 60 * 1000;
    const ctx = new ContextMock({
      params: {
        collectionId: collection._id,
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
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
