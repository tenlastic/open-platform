import {
  BuildPermissions,
  GameServerPermissions,
  QueuePermissions,
  WorkflowPermissions,
} from '@tenlastic/mongoose';
import { Context, logs, LogsOptions } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context<LogsOptions>) {
  switch (ctx.params.collection) {
    case 'builds':
      return logs(ctx, BuildPermissions);

    case 'game-servers':
      return logs(ctx, GameServerPermissions);

    case 'queues':
      return logs(ctx, QueuePermissions);

    case 'workflows':
      return logs(ctx, WorkflowPermissions);
  }
}
