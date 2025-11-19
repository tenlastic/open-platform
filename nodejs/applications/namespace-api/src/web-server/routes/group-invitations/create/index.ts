import {
  GroupInvitationDocument,
  GroupInvitationModel,
  GroupInvitationPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CreateContext } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: CreateContext<GroupInvitationDocument>) {
  const fromUserId = new mongoose.Types.ObjectId(ctx.state.user._id);

  const context = {
    credentials: { ...ctx.state },
    Model: GroupInvitationModel,
    options: GroupInvitationPermissionOptions,
  };
  const overlayParameters = { ...ctx.params, fromUserId };

  const result = await permissions.create(context, ctx.request.body, overlayParameters);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
