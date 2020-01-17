import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import {
  CollectionDocument,
  CollectionMock,
  DatabaseDocument,
  DatabaseMock,
  RecordSchema,
} from '../../../models';
import { handler } from './';

describe('handlers/records/find', function() {
  let collection: CollectionDocument;
  let database: DatabaseDocument;
  let user: any;

  beforeEach(async function() {
    database = await DatabaseMock.create();
    collection = await CollectionMock.create({
      databaseId: database._id,
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
    user = { _id: mongoose.Types.ObjectId(), roles: ['Administrator'] };
  });

  it('returns the matching records', async function() {
    const Model = RecordSchema.getModelForClass(collection);
    await Model.create({
      collectionId: collection.id,
      databaseId: collection.databaseId,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: {
        collectionName: collection.name,
        databaseName: database.name,
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records).to.exist;
    expect(ctx.response.body.records.length).to.eql(1);
  });

  it('properly handles Dates', async function() {
    const Model = RecordSchema.getModelForClass(collection);
    await Model.create({
      collectionId: collection.id,
      databaseId: collection.databaseId,
      properties: {
        insertedAt: new Date().toISOString(),
      },
      userId: user._id,
    });

    const ONE_HOUR = 60 * 60 * 1000;
    const ctx = new ContextMock({
      params: {
        collectionName: collection.name,
        databaseName: database.name,
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
