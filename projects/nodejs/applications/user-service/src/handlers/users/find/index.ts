import { Context, RestController } from '@tenlastic/api-module';

import { User, UserDocument, UserModel, UserPermissions } from '../../../models';

const restController = new RestController<UserDocument, UserModel, UserPermissions>(
  User,
  new UserPermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.find(ctx.request.query, ctx.state.user);

  ctx.response.body = { records: result };
}
