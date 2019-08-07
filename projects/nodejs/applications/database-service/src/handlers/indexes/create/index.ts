import { Context } from '@tenlastic/api-module';
import * as rabbitmq from '@tenlastic/rabbitmq-module';
import * as mongoose from 'mongoose';

import { CollectionPermissions, CollectionSchema } from '../../../models';
import { CreateCollectionIndexMessage } from '../../../workers/create-collection-index';

const permissions = new CollectionPermissions();

export async function handler(ctx: Context) {
  const query = {
    where: {
      _id: ctx.params.collectionId,
      databaseId: ctx.params.databaseId,
    },
  };

  const collections = await permissions.find(query, {}, ctx.state.user);
  if (collections.length === 0) {
    throw new Error('Collection not found.');
  }

  const collection = collections[0];
  const updatePermissions = await permissions.updatePermissions(collection, ctx.state.user);
  if (!updatePermissions.includes('indexes')) {
    throw new Error('User does not have permission to perform this action.');
  }

  const { key, options } = ctx.request.body;
  if (!key) {
    throw new Error('Missing required fields: key.');
  }

  const msg: CreateCollectionIndexMessage = {
    collectionId: collection._id.toString(),
    databaseId: collection.databaseId.toString(),
    indexId: mongoose.Types.ObjectId().toHexString(),
    key,
    options,
  };
  await rabbitmq.publish(CollectionSchema.CREATE_INDEX_QUEUE, msg);

  ctx.response.status = 200;
}
