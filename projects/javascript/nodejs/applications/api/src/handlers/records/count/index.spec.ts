import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { CollectionDocument, CollectionMock, RecordSchema } from '@tenlastic/mongoose-models';
import { handler } from './';

describe('handlers/records/count', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      jsonSchema: {
        type: 'object',
      },
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
    user = { _id: mongoose.Types.ObjectId(), roles: ['collections'] };
  });

  it('returns the number of matching records', async function() {
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

    expect(ctx.response.body.count).to.eql(1);
  });
});
