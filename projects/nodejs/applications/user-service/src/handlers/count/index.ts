import { RestController } from '@tenlastic/api-module';
import { Context } from 'koa';

import { User, UserDocument, UserModel, UserPermissions } from '../../models';
import { app } from '../../';

export async function controller(ctx: Context) {
  const restController = new RestController<UserDocument, UserModel, UserPermissions>(
    User,
    new UserPermissions(),
  );
  const result = await restController.count(ctx.query.where, ctx.state.user);

  ctx.body = { count: result };
}

app.use(controller);

export const handler = app.listen();
