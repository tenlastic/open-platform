import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ArticlePermissions, Game } from '../../../models';

export async function handler(ctx: Context) {
  const game = await Game.findOne({ slug: ctx.params.gameSlug });
  if (!game) {
    throw new RecordNotFoundError('Game');
  }

  const override = { gameId: game._id };
  const result = await ArticlePermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
