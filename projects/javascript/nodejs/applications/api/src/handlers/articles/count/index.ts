import { Context } from '@tenlastic/web-server';

import { ArticlePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ArticlePermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
