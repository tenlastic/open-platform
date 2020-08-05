import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ArticlePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await ArticlePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Article');
  }

  ctx.response.body = { record: result };
}
