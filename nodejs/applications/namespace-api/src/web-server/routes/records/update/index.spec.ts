import {
  CollectionDocument,
  CollectionJsonSchemaType,
  CollectionModel,
  CollectionPermissionsModel,
  NamespaceModel,
  RecordDocument,
  RecordSchema,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/records/update', function () {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();

    const namespace = await NamespaceModel.mock().save();
    collection = await CollectionModel.mock({
      jsonSchema: {
        properties: {
          email: { type: CollectionJsonSchemaType.String },
          name: { type: CollectionJsonSchemaType.String },
        },
        type: CollectionJsonSchemaType.Object,
      },
      namespaceId: namespace._id,
      permissions: CollectionPermissionsModel.mock({
        find: new Map(Object.entries({ public: {} })),
        read: new Map(
          Object.entries({
            public: ['_id', 'createdAt', 'properties.email', 'properties.name', 'updatedAt'],
          }),
        ),
        roles: new Map(Object.entries({ public: {} })),
        update: new Map(Object.entries({ public: ['properties.email', 'properties.name'] })),
      }),
    }).save();

    const Model = RecordSchema.getModel(collection);
    record = await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      userId: user._id,
    });
  });

  it('returns the matching record', async function () {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = new ContextMock({
      params: { _id: record._id.toString(), collectionId: collection._id },
      request: { body: { properties } },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties.email).to.eql(properties.email);
    expect(ctx.response.body.record.properties.name).to.eql(properties.name);
  });
});
