import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ArticlePermissions, Game } from '../../../models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ slug: ctx.params.gameSlug });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const override = { where: { _id: ctx.params._id, gameId: game._id } };
  const result = await ArticlePermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Article');
  }

  ctx.response.body = { record: result };
}
