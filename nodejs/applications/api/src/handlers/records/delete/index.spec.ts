import {
  AuthorizationMock,
  AuthorizationRole,
  CollectionDocument,
  CollectionMock,
  NamespaceMock,
  RecordDocument,
  RecordSchema,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('handlers/records/delete', function () {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();

    const namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.CollectionsReadWrite],
      userId: user._id,
    });

    collection = await CollectionMock.create({
      namespaceId: namespace._id,
      permissions: {
        create: {},
        delete: {
          default: true,
        },
        find: {
          default: {},
        },
        read: {
          default: ['_id', 'createdAt', 'properties', 'updatedAt'],
        },
        roles: [],
        update: {},
      },
    });

    const Model = RecordSchema.getModel(collection);
    record = await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      userId: user._id,
    });
  });

  it('returns the matching record', async function () {
    const ctx = new ContextMock({
      params: {
        _id: record._id.toString(),
        collectionId: collection._id,
      },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
