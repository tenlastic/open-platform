import {
  BuildDocument,
  BuildModel,
  BuildPermissionOptions,
  GameServerDocument,
  GameServerModel,
  GameServerPermissionOptions,
  QueueDocument,
  QueueModel,
  QueuePermissionOptions,
  WorkflowDocument,
  WorkflowModel,
  WorkflowPermissionOptions,
} from '@tenlastic/mongoose';
import { logs, LogsContext } from '@tenlastic/web-socket-server';

export async function handler(ctx: LogsContext) {
  switch (ctx.params.collection) {
    case 'builds':
      return logs<BuildDocument>(ctx, BuildModel, BuildPermissionOptions);

    case 'game-servers':
      return logs<GameServerDocument>(ctx, GameServerModel, GameServerPermissionOptions);

    case 'queues':
      return logs<QueueDocument>(ctx, QueueModel, QueuePermissionOptions);

    case 'workflows':
      return logs<WorkflowDocument>(ctx, WorkflowModel, WorkflowPermissionOptions);
  }
}
