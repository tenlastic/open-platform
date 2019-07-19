import { Context, RestController } from '@tenlastic/api-module';

import { User, UserDocument, UserModel, UserPermissions } from '../../../models';

const restController = new RestController<UserDocument, UserModel, UserPermissions>(
  User,
  new UserPermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
