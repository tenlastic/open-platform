import {
  CollectionDocument,
  CollectionMock,
  NamespaceCollectionLimits,
  NamespaceLimitError,
  NamespaceLimits,
  NamespaceMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/records/create', function() {
  let collection: CollectionDocument;
  let user: any;

  beforeEach(async function() {
    const namespace = await NamespaceMock.create({
      limits: new NamespaceLimits({
        collections: new NamespaceCollectionLimits({ size: 1 }),
      }),
    });
    collection = await CollectionMock.create({
      jsonSchema: {
        properties: {
          email: { type: 'string' },
          name: { type: 'string' },
        },
        type: 'object',
      },
      namespaceId: namespace._id,
      permissions: {
        create: {
          default: ['properties.email', 'properties.name'],
        },
        delete: {},
        find: {
          default: {},
        },
        read: {
          default: ['_id', 'createdAt', 'properties.email', 'properties.name', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });
    user = { _id: mongoose.Types.ObjectId() };
  });

  context('when too many records exist', function() {
    it('throws a NamespaceLimitError', async function() {
      const properties = { email: chance.email(), name: chance.name() };
      const ctx = new ContextMock({
        params: {
          collectionId: collection._id,
        },
        request: {
          body: { properties },
        },
        state: { user },
      });

      await handler(ctx as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when few enough records exist', function() {
    it('creates a new record', async function() {
      const properties = { email: chance.email(), name: chance.name() };
      const ctx = new ContextMock({
        params: {
          collectionId: collection._id,
        },
        request: {
          body: { properties },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.record.properties.email).to.eql(properties.email);
      expect(ctx.response.body.record.properties.name).to.eql(properties.name);
    });
  });
});
