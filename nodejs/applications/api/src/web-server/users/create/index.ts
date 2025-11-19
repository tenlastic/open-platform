import { UserDocument, UserModel, UserPermissionOptions } from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext } from '@tenlastic/web-server';

export async function handler(ctx: CreateContext<UserDocument>) {
  const context = {
    credentials: { ...ctx.state },
    Model: UserModel,
    options: UserPermissionOptions,
  };
  const user = await permissions.create(context, ctx.request.body, {});

  // Refresh the User's accessible fields.
  const result = await permissions.findOne(context, {}, { where: { _id: user._id } });
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
