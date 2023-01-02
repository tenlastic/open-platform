import {
  CollectionDocument,
  CollectionJsonSchemaModel,
  CollectionJsonSchemaType,
  CollectionModel,
  CollectionPermissionsModel,
  NamespaceModel,
  RecordSchema,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import { handler } from './';

describe('web-server/records/count', function () {
  let collection: CollectionDocument;
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();

    const namespace = await NamespaceModel.mock().save();
    collection = await CollectionModel.mock({
      jsonSchema: CollectionJsonSchemaModel.mock({ type: CollectionJsonSchemaType.Object }),
      namespaceId: namespace._id,
      permissions: CollectionPermissionsModel.mock({
        create: new Map(Object.entries({ public: ['properties'] })),
        find: new Map(Object.entries({ public: {} })),
        read: new Map(Object.entries({ public: ['_id', 'createdAt', 'properties', 'updatedAt'] })),
        roles: new Map(Object.entries({ public: {} })),
      }),
    }).save();
  });

  it('returns the number of matching records', async function () {
    const Model = RecordSchema.getModel(collection);
    await Model.create({
      collectionId: collection._id,
      namespaceId: collection.namespaceId,
      userId: user._id,
    });

    const ctx = new ContextMock({
      params: { collectionId: collection._id },
      state: { user },
    });

    await handler(ctx as any);

    expect(ctx.response.body.count).to.eql(1);
  });
});
