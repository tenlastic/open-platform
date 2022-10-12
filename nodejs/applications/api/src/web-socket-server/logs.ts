import { podApiV1 } from '@tenlastic/kubernetes';
import { MongoosePermissions, PermissionError } from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';
import * as webSocketServer from '@tenlastic/web-socket-server';
import { WebSocket } from '@tenlastic/web-socket-server';

import { Authorization, AuthorizationDocument, NamespacePermissions, User } from '../mongodb';

export interface LogsData {
  _id: string;
  method: string;
  parameters?: LogsDataParameters;
}

export interface LogsDataParameters {
  namespaceId?: string;
  nodeId: string;
  since?: string;
  tail?: number;
}

export const abortControllers = new Map<WebSocket, Map<string, AbortController>>();

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
  if ('namespaceId' in data.parameters) {
    _id = data.parameters.namespaceId;
    Permissions = NamespacePermissions;
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
  const { abortController, emitter } = await podApiV1.followNamespacedPodLog(
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
  abortControllers.set(ws, abortControllers.has(ws) ? abortControllers.get(ws) : new Map());
  abortControllers.get(ws).set(data._id, abortController);

  ws.on('close', () => abortController.abort());
}

function unsubscribe(data: LogsData, ws: webSocketServer.WebSocket) {
  if (!abortControllers.has(ws) || !abortControllers.get(ws).has(data._id)) {
    return;
  }

  // Abort the request.
  const abortController = abortControllers.get(ws).get(data._id);
  abortController.abort();

  // Remove the Cancel Token Source from memory.
  abortControllers.get(ws).delete(data._id);
}
