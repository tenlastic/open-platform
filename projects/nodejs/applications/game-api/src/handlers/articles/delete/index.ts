import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Article, ArticlePermissions, Game } from '../../../models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ slug: ctx.params.gameSlug });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const where = await ArticlePermissions.where(
    { _id: ctx.params._id, gameId: game._id },
    ctx.state.user,
  );
  const record = await Article.findOne(where).populate(
    ArticlePermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Article');
  }

  const result = await ArticlePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
