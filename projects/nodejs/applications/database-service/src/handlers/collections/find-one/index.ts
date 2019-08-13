import { Context, RecordNotFoundError } from '@tenlastic/api-module';

import { CollectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params.id, databaseId: ctx.params.databaseId } };
  const result = await CollectionPermissions.findOne({}, override, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError();
  }

  ctx.response.body = { record: result };
}
