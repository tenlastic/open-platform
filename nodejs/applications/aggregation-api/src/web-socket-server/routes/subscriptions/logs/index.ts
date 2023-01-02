import { NamespacePermissions } from '@tenlastic/mongoose';
import { Context, logs, LogsOptions } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context<LogsOptions>) {
  switch (ctx.params.collection) {
    case 'namespaces':
      return logs(ctx, NamespacePermissions);
  }
}
