import { Context } from '@tenlastic/api-module';
import * as rabbitmq from '@tenlastic/rabbitmq-module';

import { CollectionPermissions, CollectionSchema } from '../../../models';
import { DeleteCollectionIndexMessage } from '../../../workers';

export async function handler(ctx: Context) {
  const override = {
    where: {
      _id: ctx.params.collectionId,
      databaseId: ctx.params.databaseId,
    },
  };

  const collections = await CollectionPermissions.find({}, override, ctx.state.user);
  if (collections.length === 0) {
    throw new Error('Collection not found.');
  }

  const collection = collections[0];
  const updatePermissions = await CollectionPermissions.updatePermissions(
    collection,
    ctx.state.user,
  );
  if (!updatePermissions.includes('indexes')) {
    throw new Error('User does not have permission to perform this action.');
  }

  const msg: DeleteCollectionIndexMessage = {
    collectionId: collection._id.toString(),
    databaseId: collection.databaseId.toString(),
    indexId: ctx.params.id,
  };
  await rabbitmq.publish(CollectionSchema.DELETE_INDEX_QUEUE, msg);

  ctx.response.status = 200;
}
