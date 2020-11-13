import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { CollectionDocument, CollectionMock, RecordSchema } from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/records/find', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      jsonSchema: {
        properties: {
          insertedAt: { type: 'string', format: 'date-time' },
        },
        type: 'object',
      },
      permissions: {
        create: {
          base: ['properties'],
        },
        delete: {},
        find: {
          base: {},
        },
        read: {
          base: ['_id', 'createdAt', 'properties', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });
    user = { _id: mongoose.Types.ObjectId() };
  });

  it('returns the matching records', async function() {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: {
        collectionId: collection._id,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });

  it('properly handles Dates', async function() {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      properties: {
        insertedAt: new Date().toISOString(),
      },
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
