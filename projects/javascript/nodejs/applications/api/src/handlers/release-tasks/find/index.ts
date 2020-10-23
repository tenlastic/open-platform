import { Context } from '@tenlastic/web-server';

import { ReleaseTaskPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { releaseId: ctx.params.releaseId } };
  const result = await ReleaseTaskPermissions.find(
    ctx.request.query,
    override,
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { records: result };
}
