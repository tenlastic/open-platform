import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { CollectionDocument, CollectionMock, RecordDocument, RecordSchema } from '../../../models';
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
          base: true,
        },
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

    const Model = RecordSchema.getModelForClass(collection);
    record = await Model.create({
      collectionId: collection.id,
      databaseId: collection.databaseId,
    });
  });

  it('returns the matching record', async function() {
    const ctx = new ContextMock({
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
        id: record._id.toString(),
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
