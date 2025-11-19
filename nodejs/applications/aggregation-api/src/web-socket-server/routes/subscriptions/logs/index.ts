import { NamespaceModel, NamespacePermissionOptions } from '@tenlastic/mongoose';
import { logs, LogsContext } from '@tenlastic/web-socket-server';

export async function handler(ctx: LogsContext) {
  switch (ctx.params.collection) {
    case 'namespaces':
      return logs(ctx, NamespaceModel, NamespacePermissionOptions);
  }
}
