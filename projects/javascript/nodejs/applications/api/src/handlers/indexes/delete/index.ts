import { IndexDocument } from '@tenlastic/mongoose-models';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { DeleteCollectionIndex } from '@tenlastic/rabbitmq-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions } from '@tenlastic/mongoose-models';

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

  const index = collection.indexes.find(i => i._id.equals(ctx.params._id));
  if (!index) {
    throw new RecordNotFoundError('Index');
  }

  await DeleteCollectionIndex.publish(index as IndexDocument);

  ctx.response.status = 200;
}
