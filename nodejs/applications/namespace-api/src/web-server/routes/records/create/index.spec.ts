import {
  CollectionDocument,
  CollectionModel,
  CollectionPermissionsModel,
  JsonSchemaType,
  NamespaceModel,
  RecordDocument,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock, CreateContext } from '@tenlastic/web-server';

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

describe('web-server/records/create', function () {
  let collection: CollectionDocument;
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
        create: new Map(Object.entries({ public: ['properties.email', 'properties.name'] })),
        find: new Map(Object.entries({ public: {} })),
        read: new Map(
          Object.entries({
            public: ['_id', 'createdAt', 'properties.email', 'properties.name', 'updatedAt'],
          }),
        ),
        roles: new Map(Object.entries({ public: {} })),
      }),
    }).save();
  });

  it('creates a new record', async function () {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = ContextMock<CreateContext<RecordDocument<Properties>>>({
      params: { collectionId: collection._id },
      request: { body: { properties } },
      state: { user: { _id: user._id.toHexString() } },
    });

    await handler(ctx);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties.email).to.eql(properties.email);
    expect(ctx.response.body.record.properties.name).to.eql(properties.name);
  });
});
