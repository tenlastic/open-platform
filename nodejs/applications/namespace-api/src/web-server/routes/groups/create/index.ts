import { GroupDocument, GroupModel, GroupPermissionOptions } from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: CreateContext<GroupDocument>) {
  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);

  const context = {
    credentials: { ...ctx.state },
    Model: GroupModel,
    options: GroupPermissionOptions,
  };
  const overlayParameters = { ...ctx.params, userId, userIds: [userId] };

  const result = await permissions.create(context, {}, overlayParameters);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
