import { PermissionError } from '@tenlastic/mongoose-permissions';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Context, RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';

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

  const { key, options } = ctx.request.body;
  if (!key) {
    throw new RequiredFieldError(['key']);
  }

  const msg = new Index({
    collectionId: collection._id,
    databaseId: collection.databaseId,
    key,
    options,
  });
  await rabbitmq.publish(CREATE_COLLECTION_INDEX_QUEUE, msg);

  ctx.response.status = 200;
  ctx.response.body = {};
}
