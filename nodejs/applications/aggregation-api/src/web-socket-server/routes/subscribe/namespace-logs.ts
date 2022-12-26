import { NamespacePermissions } from '@tenlastic/mongoose';
import { Context, logs } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context) {
  return logs(ctx, NamespacePermissions);
}
