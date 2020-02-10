import { Context } from '@tenlastic/web-server';

import { ReleaseJobPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { releaseId: ctx.params.releaseId };
  const result = await ReleaseJobPermissions.count(
    ctx.request.query.where,
    override,
    ctx.state.user,
  );

  ctx.response.body = { count: result };
}
