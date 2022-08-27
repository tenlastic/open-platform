import { podApiV1 } from '@tenlastic/kubernetes';
import {
  Authorization,
  BuildPermissions,
  GameServerPermissions,
  QueuePermissions,
  WorkflowPermissions,
} from '@tenlastic/mongoose-models';
import { MongoosePermissions, PermissionError } from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';
import * as webSocketServer from '@tenlastic/web-socket-server';
import { WebSocket } from '@tenlastic/web-socket-server';
import { CancelTokenSource } from 'axios';

export interface LogsData {
  _id: string;
  method: string;
  parameters?: LogsDataParameters;
}

export interface LogsDataParameters {
  buildId?: string;
  gameServerId?: string;
  nodeId: string;
  queueId?: string;
  since?: string;
  tail?: number;
  workflowId?: string;
}

export const cancelTokenSources = new Map<WebSocket, Map<string, CancelTokenSource>>();

export async function logs(
  auth: webSocketServer.AuthenticationData,
  data: LogsData,
  ws: webSocketServer.WebSocket,
) {
  // Unsubscribe if no parameters are defined.
  if (!data.parameters) {
    return unsubscribe(data, ws);
  }

  // Dynamically set _id and Permissions depending on requested resource.
  let _id: string;
  let container: string;
  let Permissions: MongoosePermissions<any>;
  if ('buildId' in data.parameters) {
    _id = data.parameters.buildId;
    container = 'main';
    Permissions = BuildPermissions;
  } else if ('gameServerId' in data.parameters) {
    _id = data.parameters.gameServerId;
    Permissions = GameServerPermissions;
  } else if ('queueId' in data.parameters) {
    _id = data.parameters.queueId;
    Permissions = QueuePermissions;
  } else if ('workflowId' in data.parameters) {
    _id = data.parameters.workflowId;
    container = 'main';
    Permissions = WorkflowPermissions;
  } else {
    throw new Error('Invalid arguments.');
  }

  // Check if the user can access the record.
  const authorization = await Authorization.findOne({
    namespaceId: { $exists: false },
    userId: auth.jwt?.user?._id,
  });
  const credentials = { apiKey: auth.apiKey, authorization, user: auth.jwt.user };
  const override = { where: { _id } };
  const record = await Permissions.findOne(credentials, override, {});
  if (!record) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the record contains the requested node.
  const node = record.status?.nodes?.find((n) => n._id === data.parameters.nodeId);
  if (!node) {
    throw new RecordNotFoundError('Record');
  }

  // Check if the user can access the record's logs.
  const permissions = await Permissions.getFieldPermissions(credentials, 'read', record);
  if (!permissions.includes('logs')) {
    throw new PermissionError();
  }

  // Start streaming the logs.
  const pod = await podApiV1.read(node._id, 'dynamic');
  const { cancelTokenSource, emitter } = await podApiV1.followNamespacedPodLog(
    node._id,
    'dynamic',
    container || pod.body.spec.containers[0].name,
    { since: data.parameters.since, tail: data.parameters.tail },
  );
  emitter.on('data', (log) => ws.send(JSON.stringify({ _id: data._id, fullDocument: log })));
  emitter.on('end', async () => ws.send(JSON.stringify({ _id: data._id })));
  emitter.on('error', async (e) => {
    console.error(e);

    const { message, name } = e;
    const errors = { _id: data._id, errors: [{ message, name }] };
    ws.send(JSON.stringify(errors));
  });

  // Cache the request.
  cancelTokenSources.set(ws, cancelTokenSources.has(ws) ? cancelTokenSources.get(ws) : new Map());
  cancelTokenSources.get(ws).set(data._id, cancelTokenSource);

  ws.on('close', () => cancelTokenSource.cancel());
}

function unsubscribe(data: LogsData, ws: webSocketServer.WebSocket) {
  if (!cancelTokenSources.has(ws) || !cancelTokenSources.get(ws).has(data._id)) {
    return;
  }

  // Abort the request.
  const cancelTokenSource = cancelTokenSources.get(ws).get(data._id);
  cancelTokenSource.cancel();

  // Remove the Cancel Token Source from memory.
  cancelTokenSources.get(ws).delete(data._id);
}
