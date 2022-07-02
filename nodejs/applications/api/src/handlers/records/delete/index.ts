import { Collection, RecordSchema } from '@tenlastic/mongoose-models';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, collectionId } = ctx.params;
  const user = ctx.state.apiKey || ctx.state.user;

  const collection = await Collection.findOne({ _id: collectionId });
  if (!collection) {
    throw new RecordNotFoundError('Collection');
  }

  const Model = RecordSchema.getModel(collection);
  const Permissions = RecordSchema.getPermissions(Model, collection);

  const existing = await Permissions.findOne({}, { where: { _id, collectionId } }, user);
  if (!existing) {
    throw new RecordNotFoundError('Record');
  }

  const result = await Permissions.delete(existing, user);
  const record = await Permissions.read(result, user);

  ctx.response.body = { record };
}
