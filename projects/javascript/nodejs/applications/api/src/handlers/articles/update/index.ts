import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Article, ArticlePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await ArticlePermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await Article.findOne(where).populate(
    ArticlePermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Article');
  }

  const override = { namespaceId: ctx.params.namespaceId };
  const result = await ArticlePermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
