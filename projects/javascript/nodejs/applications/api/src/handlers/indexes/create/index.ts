import { PermissionError } from '@tenlastic/mongoose-permissions';
import { CreateCollectionIndex } from '@tenlastic/rabbitmq-models';
import { Context, RecordNotFoundError, RequiredFieldError } from '@tenlastic/web-server';

import { CollectionPermissions, Index } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = {
    where: {
      _id: ctx.params.collectionId,
    },
  };

  const collections = await CollectionPermissions.find(
    {},
    override,
    ctx.state.apiKey || ctx.state.user,
  );
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

  const index = new Index({
    collectionId: collection._id,
    key,
    options,
  });
  await CreateCollectionIndex.publish(index);

  ctx.response.status = 200;
  ctx.response.body = {};
}
