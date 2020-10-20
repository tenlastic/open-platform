import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { ReleasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const record = await ReleasePermissions.findOne(
    {},
    { where: { _id: ctx.params._id } },
    ctx.state.user,
  );
  if (!record) {
    throw new RecordNotFoundError('Release');
  }

  const override = { namespaceId: ctx.params.namespaceId };
  const result = await ReleasePermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
