import { podApiV1 } from '@tenlastic/kubernetes';
import { MongoosePermissions, PermissionError } from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';
import * as webSocketServer from '@tenlastic/web-socket-server';
import { WebSocket } from '@tenlastic/web-socket-server';

import {
  Authorization,
  AuthorizationDocument,
  BuildPermissions,
  GameServerPermissions,
  QueuePermissions,
  User,
  WorkflowPermissions,
} from '../mongodb';

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

export type Abort = () => void;

export const aborts = new Map<WebSocket, Map<string, Abort>>();

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
  let authorization: AuthorizationDocument;
  if (auth.jwt?.authorization) {
    authorization = Authorization.hydrate(auth.jwt.authorization);
  } else if (auth.jwt?.user) {
    authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: auth.jwt?.user?._id,
    });
  }
  const user = auth.jwt?.user ? User.hydrate(auth.jwt.user) : null;

  const credentials = { apiKey: auth.apiKey, authorization, user };
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
  const { abort, emitter } = await podApiV1.followNamespacedPodLog(
    node._id,
    'dynamic',
    container || pod.body.spec.containers[0].name,
    { since: data.parameters.since, tail: data.parameters.tail },
  );
  emitter.on('close', async () => ws.send(JSON.stringify({ _id: data._id })));
  emitter.on('data', (log) => ws.send(JSON.stringify({ _id: data._id, fullDocument: log })));
  emitter.on('error', async (e) => {
    console.error(e);

    const { message, name } = e;
    const errors = { _id: data._id, errors: [{ message, name }] };
    ws.send(JSON.stringify(errors));
  });

  // Cache the request.
  aborts.set(ws, aborts.has(ws) ? aborts.get(ws) : new Map());
  aborts.get(ws).set(data._id, abort);

  ws.on('close', () => abort());
}

function unsubscribe(data: LogsData, ws: webSocketServer.WebSocket) {
  if (!aborts.has(ws) || !aborts.get(ws).has(data._id)) {
    return;
  }

  // Abort the request.
  const abort = aborts.get(ws).get(data._id);
  abort();

  // Remove the Cancel Token Source from memory.
  aborts.get(ws).delete(data._id);
}
