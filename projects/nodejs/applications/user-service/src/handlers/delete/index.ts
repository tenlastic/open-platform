import { Context, RestController } from '@tenlastic/api-module';

import { User, UserDocument, UserModel, UserPermissions } from '../../models';
import { router } from '../';

const restController = new RestController<UserDocument, UserModel, UserPermissions>(
  User,
  new UserPermissions(),
);

export async function handler(ctx: Context) {
  const result = await restController.remove(ctx.params.id, ctx.state.user);

  ctx.response.body = { record: result };
}

router.delete('/:id', handler);
