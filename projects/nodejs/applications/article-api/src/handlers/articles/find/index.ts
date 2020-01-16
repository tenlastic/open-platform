import { Context } from '@tenlastic/web-server';

import { ArticlePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ArticlePermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
