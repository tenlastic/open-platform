import { WebSocketDocument, WebSocketModel, WebSocketPermissions } from '@tenlastic/mongoose';
import { ICredentials } from '@tenlastic/mongoose-permissions';
import { State, StatusCode, WebSocket as WS } from '@tenlastic/web-socket-server';

export async function connection(podName: string, state: State, ws: WS) {
  if (!state.jwt?.user) {
    ws.send({ status: StatusCode.OK });
    return;
  }

  // Add the WebSocket to MongoDB.
  state.webSocket = await WebSocketModel.create({
    nodeId: podName,
    userId: state.jwt.user._id,
  });

  const credentials: ICredentials = { ...state };
  const fullDocument = await WebSocketPermissions.read(
    credentials,
    state.webSocket as WebSocketDocument,
  );
  ws.send({ body: { fullDocument, operationType: 'insert' }, status: StatusCode.OK });

  // Remove the Web Socket from MongoDB.
  ws.on('close', async () => await state.webSocket.remove());
  ws.on('error', async () => await state.webSocket.remove());
}
