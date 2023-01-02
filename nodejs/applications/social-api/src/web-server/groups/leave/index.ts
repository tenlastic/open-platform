import { GroupModel, GroupPermissions } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const group = await GroupPermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!group) {
    throw new RecordNotFoundError();
  }

  const result = await GroupModel.findOneAndUpdate(
    { _id: ctx.params._id },
    { $pull: { userIds: ctx.state.user._id } },
    { new: true },
  );
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
