import { Context } from '@tenlastic/web-server';
import * as rabbitmq from '@tenlastic/rabbitmq';

import { CollectionPermissions, Index } from '../../../models';
import { CREATE_COLLECTION_INDEX_QUEUE } from '../../../workers';

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

  const { key, options } = ctx.request.body;
  if (!key) {
    throw new Error('Missing required fields: key.');
  }

  const msg = new Index({
    collectionId: collection._id,
    databaseId: collection.databaseId,
    key,
    options,
  });
  await rabbitmq.publish(CREATE_COLLECTION_INDEX_QUEUE, msg);

  ctx.response.status = 200;
}
