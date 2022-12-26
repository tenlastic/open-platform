import { NamespaceModel, NamespacePermissions } from '@tenlastic/mongoose';
import { Context, subscribe } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context) {
  return subscribe(ctx, NamespaceModel, NamespacePermissions);
}
