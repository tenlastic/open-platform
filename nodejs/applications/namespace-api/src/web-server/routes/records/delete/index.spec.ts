import {
  Collection,
  CollectionDocument,
  CollectionModelPermissions,
  Namespace,
  RecordDocument,
  RecordSchema,
  User,
  UserDocument,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/records/delete', function () {
  let collection: CollectionDocument;
  let record: RecordDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock().save();

    const namespace = await Namespace.mock().save();
    collection = await Collection.mock({
      namespaceId: namespace._id,
      permissions: CollectionModelPermissions.mock({
        delete: new Map(Object.entries({ public: true })),
        find: new Map(Object.entries({ public: {} })),
        read: new Map(Object.entries({ public: ['_id', 'createdAt', 'properties', 'updatedAt'] })),
        roles: new Map(Object.entries({ public: {} })),
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
    const ctx = new ContextMock({
      params: { _id: record._id.toString(), collectionId: collection._id },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.record).to.exist;
  });
});
