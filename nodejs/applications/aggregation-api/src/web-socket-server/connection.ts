import { WebSocketDocument, WebSocketModel, WebSocketPermissionOptions } from '@tenlastic/mongoose';
import { DatabaseOperationType } from '@tenlastic/mongoose-nats';
import * as permissions from '@tenlastic/mongoose-permissions';
import { State, StatusCode, WebSocket } from '@tenlastic/web-socket-server';

interface ConnectionResponse<TDocument> {
  fullDocument?: TDocument;
  operationType?: DatabaseOperationType;
}

export async function connection(
  podName: string,
  state: State,
  ws: WebSocket<ConnectionResponse<Partial<permissions.DocumentToObject<WebSocketDocument>>>>,
) {
  if (!state.jwt?.user) {
    ws.send({ status: StatusCode.OK });
    return;
  }

  // Add the WebSocket to MongoDB.
  const webSocket = await WebSocketModel.create({
    nodeId: podName,
    userId: state.jwt.user._id,
  });

  state.webSocket = {
    _id: webSocket._id.toHexString(),
    namespaceId: webSocket.namespaceId.toHexString(),
  };

  const context = {
    credentials: { ...state },
    Model: WebSocketModel,
    options: WebSocketPermissionOptions,
  };
  const fullDocument = await permissions.read(context, webSocket);
  ws.send({ body: { fullDocument, operationType: 'insert' }, status: StatusCode.OK });

  // Update Web Socket in MongoDB when disconnected.
  ws.on('close', async () => await WebSocketModel.disconnect(webSocket._id));
  ws.on('error', async () => await WebSocketModel.disconnect(webSocket._id));
}
