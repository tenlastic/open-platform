import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { User, UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const record = await User.findOne({ _id: ctx.params.id }).populate(
    UserPermissions.populateOptions,
  );

  if (!record) {
    throw new RecordNotFoundError();
  }

  const result = await UserPermissions.update(record, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
