import { Context } from '@tenlastic/web-server';
import * as Chance from 'chance';

import { UserPermissions } from '../../../models';

const chance = new Chance();

export async function handler(ctx: Context) {
  const result = await UserPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
