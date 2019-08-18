import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';
import * as Chance from 'chance';

import { CollectionDocument, CollectionMock } from '../../../models';
import { handler } from './';

const chance = new Chance();

describe('handlers/records/create', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    collection = await CollectionMock.create({
      jsonSchema: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
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

  it('creates a new record', async function() {
    const customProperties = { email: chance.email(), name: chance.name() };
    const ctx = new ContextMock({
      request: {
        body: { customProperties },
      },
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.customProperties.email).to.eql(customProperties.email);
    expect(ctx.response.body.record.customProperties.name).to.eql(customProperties.name);
  });
});
