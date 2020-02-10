import { Context } from '@tenlastic/web-server';

import { ReleaseJobPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { releaseId: ctx.params.releaseId } };
  const result = await ReleaseJobPermissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
