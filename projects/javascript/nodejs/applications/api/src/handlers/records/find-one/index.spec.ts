import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { CollectionDocument, CollectionMock, RecordSchema } from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/records/find-one', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
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
    user = { _id: mongoose.Types.ObjectId() };
  });

  it('returns the matching record', async function() {
    const Model = RecordSchema.getModel(collection);
    const record = await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: {
        _id: record._id.toString(),
        collectionId: collection._id,
        databaseId: collection.databaseId,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
