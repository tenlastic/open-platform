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
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        type: 'object',
      },
      permissions: {
        create: {
          base: ['customProperties.email', 'customProperties.name'],
        },
        delete: {},
        find: {
          base: {},
        },
        read: {
          base: [
            '_id',
            'createdAt',
            'customProperties.email',
            'customProperties.name',
            'updatedAt',
          ],
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
      params: {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
      },
      request: {
        body: { customProperties },
      },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.customProperties.email).to.eql(customProperties.email);
    expect(ctx.response.body.record.customProperties.name).to.eql(customProperties.name);
  });
});
