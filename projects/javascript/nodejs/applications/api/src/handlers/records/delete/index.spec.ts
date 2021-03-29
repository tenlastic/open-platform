import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import {
  CollectionDocument,
  CollectionMock,
  RecordDocument,
  RecordSchema,
} from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/records/delete', function() {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      permissions: {
        create: {},
        delete: {
          default: true,
        },
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

    const Model = RecordSchema.getModel(collection);
    record = await Model.create({
      collectionId: collection._id,
      databaseId: collection.databaseId,
      userId: user._id,
    });
  });

  it('returns the matching record', async function() {
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
