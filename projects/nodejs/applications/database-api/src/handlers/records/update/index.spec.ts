import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { CollectionDocument, CollectionMock, RecordDocument, RecordSchema } from '../../../models';
import { handler } from './';

const chance = new Chance();

describe('handlers/records/update', function() {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      permissions: {
        create: {},
        delete: {},
        find: {
          base: {},
        },
        read: {
          base: ['_id', 'createdAt', 'properties.email', 'properties.name', 'updatedAt'],
        },
        roles: [],
        update: {
          base: ['properties.email', 'properties.name'],
        },
      },
    });
    user = { _id: mongoose.Types.ObjectId(), roles: ['Admin'] };

    const Model = RecordSchema.getModelForClass(collection);
    record = await Model.create({
      collectionId: collection.id,
      databaseId: collection.databaseId,
      userId: user._id,
    });
  });

  it('returns the matching record', async function() {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = new ContextMock({
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
        id: record._id.toString(),
      },
      request: {
        body: { properties },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties).to.eql(properties);
  });
});
