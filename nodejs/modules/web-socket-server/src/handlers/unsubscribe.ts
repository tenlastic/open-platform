import { Context, StatusCode, WebSocket } from '../definitions';

type UnsubscribeCallback = () => void;

const unsubscribeCallbacks = new Map<WebSocket, Map<string, UnsubscribeCallback>>();

export function deleteUnsubscribeCallback(_id: string, ws: WebSocket) {
  if (!unsubscribeCallbacks.has(ws)) {
    return;
  }

  unsubscribeCallbacks.get(ws).delete(_id);

  if (unsubscribeCallbacks.get(ws).size === 0) {
    unsubscribeCallbacks.delete(ws);
  }
}

export function setUnsubscribeCallback(_id: string, callback: UnsubscribeCallback, ws: WebSocket) {
  if (!unsubscribeCallbacks.has(ws)) {
    unsubscribeCallbacks.set(ws, new Map());
  }

  unsubscribeCallbacks.get(ws).set(_id, callback);
}

export async function unsubscribe(ctx: Context) {
  const callback = unsubscribeCallbacks.get(ctx.ws)?.get(ctx.params._id);

  if (callback) {
    callback();
  }

  ctx.response.status = StatusCode.OK;
}
