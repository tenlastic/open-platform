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

describe('handlers/records/count', function() {
  let collection: CollectionDocument;
  let database: DatabaseDocument;
  let user: any;

  beforeEach(async function() {
    database = await DatabaseMock.create();
    collection = await CollectionMock.create({
      databaseId: database._id,
      jsonSchema: {
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

  it('returns the number of matching records', async function() {
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

    expect(ctx.response.body.count).to.eql(1);
  });
});
