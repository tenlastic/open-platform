import {
  CollectionDocument,
  CollectionMock,
  NamespaceBuildLimitsMock,
  NamespaceCollectionLimits,
  NamespaceGameLimitsMock,
  NamespaceGameServerLimitsMock,
  NamespaceLimitError,
  NamespaceLimits,
  NamespaceMock,
  RecordDocument,
  RecordSchema,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/records/update', function() {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: any;

  beforeEach(async function() {
    const namespace = await NamespaceMock.create({
      limits: new NamespaceLimits({
        builds: new NamespaceBuildLimitsMock(),
        collections: new NamespaceCollectionLimits({ size: 150 }),
        gameServers: new NamespaceGameServerLimitsMock(),
        games: new NamespaceGameLimitsMock(),
      }),
    });
    collection = await CollectionMock.create({
      namespaceId: namespace._id,
      permissions: {
        create: {},
        delete: {},
        find: {
          default: {},
        },
        read: {
          default: ['_id', 'createdAt', 'properties.email', 'properties.name', 'updatedAt'],
        },
        roles: [],
        update: {
          default: ['properties.email', 'properties.name'],
        },
      },
    });
    user = { _id: mongoose.Types.ObjectId() };

    const Model = RecordSchema.getModel(collection);
    record = await Model.create({
      collectionId: collection._id,
      userId: user._id,
    });
  });

  context('when too many records exist', function() {
    it('throws a NamespaceLimitError', async function() {
      const Model = RecordSchema.getModel(collection);
      await Model.create({
        collectionId: collection._id,
        userId: user._id,
      });

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

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(NamespaceLimitError);
    });
  });

  context('when few enough records exist', function() {
    it('returns the matching record', async function() {
      const properties = { email: chance.email(), name: chance.name() };
      const ctx = new ContextMock({
        params: {
          _id: record._id.toString(),
          collectionId: collection._id,
        },
        request: {
          body: { properties },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
      expect(ctx.response.body.record.properties).to.eql(properties);
    });
  });
});
