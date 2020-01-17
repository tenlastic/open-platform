import { Context } from '@tenlastic/web-server';

import { ArticlePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await ArticlePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
