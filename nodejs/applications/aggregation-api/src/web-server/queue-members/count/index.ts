import {
  QueueMemberDocument,
  QueueMemberModel,
  QueueMemberPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { CountContext } from '@tenlastic/web-server';

export async function handler(ctx: CountContext<QueueMemberDocument>) {
  const context = {
    credentials: { ...ctx.state },
    Model: QueueMemberModel,
    options: QueueMemberPermissionOptions,
  };

  const $match = await permissions.where(context, ctx.request.query.where);
  if ($match === null) {
    throw new permissions.PermissionError();
  }

  const result = await QueueMemberModel.getUserIdCount($match);

  ctx.response.body = { count: result };
}
