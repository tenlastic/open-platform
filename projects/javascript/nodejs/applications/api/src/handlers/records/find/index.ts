import { MongoosePermissions } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Collection, RecordDocument, RecordSchema } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { collectionId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  const results = await Permissions.find(
    ctx.request.query,
    { where: { collectionId: collection._id } },
    ctx.state.apiKey || ctx.state.user,
  );
  const records = await Promise.all(results.map(r => Permissions.read(r, user)));

  ctx.response.body = { records };
}
