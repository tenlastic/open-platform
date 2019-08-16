import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { CollectionDocument, CollectionMock, RecordSchema } from '../../../models';
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
          base: ['customProperties'],
        },
        delete: {},
        find: {},
        read: {
          base: ['_id', 'createdAt', 'customProperties', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });
    user = { roles: ['Admin'] };
  });

  it('returns the number of matching records', async function() {
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

    expect(ctx.response.body.count).to.eql(1);
  });
});
