import {
  CollectionDocument,
  CollectionMock,
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
    const namespace = await NamespaceMock.create();
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
      databaseId: collection.databaseId,
      userId: user._id,
    });
  });

  it('returns the matching record', async function() {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = new ContextMock({
      params: {
        _id: record._id.toString(),
        collectionId: collection._id,
        databaseId: collection.databaseId,
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
