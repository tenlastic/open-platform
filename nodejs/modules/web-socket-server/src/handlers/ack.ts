import { Context, StatusCode, WebSocket } from '../definitions';

type AckCallback = () => void;

const ackCallbacks = new Map<WebSocket, Map<string, AckCallback>>();

export async function ack(ctx: Context) {
  const callback = ackCallbacks.get(ctx.ws)?.get(ctx.request.params._id);

  if (callback) {
    callback();
  }

  ctx.response.status = StatusCode.OK;
}

export function deleteAckCallback(_id: string, ws: WebSocket) {
  if (!ackCallbacks.has(ws)) {
    return;
  }

  ackCallbacks.get(ws).delete(_id);

  if (ackCallbacks.get(ws).size === 0) {
    ackCallbacks.delete(ws);
  }
}

export function setAckCallback(_id: string, callback: AckCallback, ws: WebSocket) {
  if (!ackCallbacks.has(ws)) {
    ackCallbacks.set(ws, new Map());
  }

  ackCallbacks.get(ws).set(_id, callback);
}
