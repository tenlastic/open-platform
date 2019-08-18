import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { CollectionDocument, CollectionMock, RecordSchema } from '../../../models';
import { handler } from './';

describe('handlers/records/find', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      jsonSchema: {
        type: 'object',
        properties: {
          insertedAt: { type: 'string', format: 'date-time' },
        },
      },
      permissions: {
        create: {
          base: ['customProperties'],
        },
        delete: {},
        find: {
          base: {},
        },
        read: {
          base: ['_id', 'createdAt', 'customProperties', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });
    user = { roles: ['Admin'] };
  });

  it('returns the matching records', async function() {
    const Model = RecordSchema.getModelForClass(collection);
    await Model.create({ collectionId: collection.id, databaseId: collection.databaseId });

    const ctx = new ContextMock({
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });

  it('properly handles Dates', async function() {
    const Model = RecordSchema.getModelForClass(collection);
    const record = await Model.create({
      collectionId: collection.id,
      customProperties: {
        insertedAt: new Date().toISOString(),
      },
      databaseId: collection.databaseId,
    });

    const ONE_HOUR = 60 * 60 * 1000;
    const ctx = new ContextMock({
      request: {
        query: {
          where: {
            'customProperties.insertedAt': {
              $gt: new Date(new Date().getTime() - ONE_HOUR),
            },
          },
        },
      },
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });
});
