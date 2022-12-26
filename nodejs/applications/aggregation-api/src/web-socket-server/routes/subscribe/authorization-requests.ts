import { AuthorizationRequestModel, AuthorizationRequestPermissions } from '@tenlastic/mongoose';
import { Context, subscribe } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context) {
  return subscribe(ctx, AuthorizationRequestModel, AuthorizationRequestPermissions);
}
