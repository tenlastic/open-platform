import {
  CollectionDocument,
  CollectionModel,
  CollectionPermissionsModel,
  NamespaceDocument,
  NamespaceModel,
  RecordSchema,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/records/find-one', function () {
  let collection: CollectionDocument;
  let namespace: NamespaceDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
    namespace = await NamespaceModel.mock().save();
    collection = await CollectionModel.mock({
      namespaceId: namespace._id,
      permissions: CollectionPermissionsModel.mock({
        create: new Map(Object.entries({ public: ['properties'] })),
        find: new Map(Object.entries({ public: {} })),
        read: new Map(Object.entries({ public: ['_id', 'createdAt', 'properties', 'updatedAt'] })),
        roles: new Map(Object.entries({ public: {} })),
      }),
    }).save();
  });

  it('returns the matching record', async function () {
    const Model = RecordSchema.getModel(collection);
    const record = await Model.create({
      collectionId: collection._id,
      namespaceId: namespace._id,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: { _id: record._id.toString(), collectionId: collection._id },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
