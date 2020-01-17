import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Release, ReleasePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await ReleasePermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const record = await Release.findOne(where).populate(
    ReleasePermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Release');
  }

  const result = await ReleasePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
