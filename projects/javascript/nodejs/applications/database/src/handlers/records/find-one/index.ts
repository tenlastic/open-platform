import { Collection, RecordSchema } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, collectionId, databaseId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId, databaseId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  const result = await Permissions.findOne({}, { where: { _id, collectionId, databaseId } }, user);
  if (!result) {
    throw new RecordNotFoundError('Record');
  }

  const record = await Permissions.read(result, user);

  ctx.response.body = { record };
}
