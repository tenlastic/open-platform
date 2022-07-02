import {
  CollectionDocument,
  CollectionMock,
  NamespaceMock,
  NamespaceRole,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/records/create', function () {
  let collection: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespaceUser = NamespaceUserMock.create({
      _id: user._id,
      roles: [NamespaceRole.Collections],
    });
    const namespace = await NamespaceMock.create({ users: [namespaceUser] });

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
  });

  it('creates a new record', async function () {
    const properties = { email: chance.email(), name: chance.name() };
    const ctx = new ContextMock({
      params: {
        collectionId: collection._id,
      },
      request: {
        body: { properties },
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
    expect(ctx.response.body.record.properties.email).to.eql(properties.email);
    expect(ctx.response.body.record.properties.name).to.eql(properties.name);
  });
});
