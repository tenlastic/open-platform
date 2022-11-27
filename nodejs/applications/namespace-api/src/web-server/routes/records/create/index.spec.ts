import {
  Collection,
  CollectionDocument,
  CollectionModelPermissions,
  Namespace,
  User,
  UserDocument,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/records/create', function () {
  let collection: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock().save();

    const namespace = await Namespace.mock().save();
    collection = await Collection.mock({
      jsonSchema: {
        properties: { email: { type: 'string' }, name: { type: 'string' } },
        type: 'object',
      },
      namespaceId: namespace._id,
      permissions: CollectionModelPermissions.mock({
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
    const ctx = new ContextMock({
      params: { collectionId: collection._id },
      request: { body: { properties } },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties.email).to.eql(properties.email);
    expect(ctx.response.body.record.properties.name).to.eql(properties.name);
  });
});
