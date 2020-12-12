import {
  Collection,
  CollectionPermissions,
  Namespace,
  NamespaceLimitError,
} from '@tenlastic/mongoose-models';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { namespaceId } = ctx.request.body;
  const user = ctx.state.apiKey || ctx.state.user;

  const count = await Collection.countDocuments({ namespaceId });
  const namespace = await Namespace.findOne({ _id: namespaceId });

  const limits = namespace.limits.collections;
  if (limits.count > 0 && count >= limits.count) {
    throw new NamespaceLimitError('collections.count', limits.count);
  }

  const result = await CollectionPermissions.create(ctx.request.body, ctx.params, user);
  const record = await CollectionPermissions.read(result, user);

  ctx.response.body = { record };
}
