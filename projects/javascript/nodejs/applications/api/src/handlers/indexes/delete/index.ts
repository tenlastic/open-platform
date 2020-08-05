import { PermissionError } from '@tenlastic/mongoose-permissions';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions } from '@tenlastic/mongoose-models';
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
    throw new RecordNotFoundError('Collection');
  }

  const collection = collections[0];
  const updatePermissions = await CollectionPermissions.accessControl.getFieldPermissions(
    'update',
    collection,
    ctx.state.user,
  );
  if (!updatePermissions.includes('indexes')) {
    throw new PermissionError();
  }

  const index = collection.indexes.find(i => i._id.equals(ctx.params.id));
  if (!index) {
    throw new RecordNotFoundError('Index');
  }

  await rabbitmq.publish(DELETE_COLLECTION_INDEX_QUEUE, index);

  ctx.response.status = 200;
  ctx.response.body = {};
}
