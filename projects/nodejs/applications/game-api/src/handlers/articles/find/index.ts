import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ArticlePermissions, Game } from '../../../models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ slug: ctx.params.gameSlug });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const override = { where: { gameId: game._id } };
  const result = await ArticlePermissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
