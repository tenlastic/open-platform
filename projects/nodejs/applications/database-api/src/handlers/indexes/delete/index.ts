import { Context } from '@tenlastic/web-server';
import * as rabbitmq from '@tenlastic/rabbitmq';

import { CollectionPermissions } from '../../../models';
import { DELETE_COLLECTION_INDEX_QUEUE } from '../../../workers';

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

  const index = collection.indexes.find(i => i._id.equals(ctx.params.id));
  if (!index) {
    throw new Error('Index not found.');
  }

  await rabbitmq.publish(DELETE_COLLECTION_INDEX_QUEUE, index);

  ctx.response.status = 200;
}
