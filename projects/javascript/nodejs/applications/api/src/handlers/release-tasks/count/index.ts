import { Context } from '@tenlastic/web-server';

import { ReleaseTaskPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { releaseId: ctx.params.releaseId };
  const result = await ReleaseTaskPermissions.count(
    ctx.request.query.where,
    override,
    ctx.state.user,
  );

  ctx.response.body = { count: result };
}
