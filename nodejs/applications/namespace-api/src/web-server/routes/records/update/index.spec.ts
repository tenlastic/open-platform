import {
  CollectionDocument,
  CollectionModel,
  CollectionPermissionsModel,
  getRecordModel,
  JsonSchemaType,
  NamespaceModel,
  RecordDocument,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, UpdateOneContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { handler } from './';

interface Properties {
  email?: string;
  name?: string;
}

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
          email: { type: JsonSchemaType.String },
          name: { type: JsonSchemaType.String },
        },
        type: JsonSchemaType.Object,
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

    const Model = getRecordModel(collection);
    record = await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      userId: user._id,
    });
  });

  it('returns the matching record', async function () {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = ContextMock<UpdateOneContext<RecordDocument<Properties>>>({
      params: { _id: record._id.toString(), collectionId: collection._id },
      request: { body: { properties } },
      state: { user: { _id: user._id.toHexString() } },
    });

    await handler(ctx);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties.email).to.eql(properties.email);
    expect(ctx.response.body.record.properties.name).to.eql(properties.name);
  });
});
