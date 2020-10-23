import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { WebSocketPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const query = {
    where: { _id: ctx.params.id },
  };

  const result = await WebSocketPermissions.findOne({}, query, ctx.state.apiKey || ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Web Socket');
  }

  ctx.response.body = { record: result };
}
