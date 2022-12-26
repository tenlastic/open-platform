import { Context, StatusCode, WebSocket } from '../definitions';

type NakCallback = () => void;

const nakCallbacks = new Map<WebSocket, Map<string, NakCallback>>();

export function deleteNakCallback(_id: string, ws: WebSocket) {
  if (!nakCallbacks.has(ws)) {
    return;
  }

  nakCallbacks.get(ws).delete(_id);

  if (nakCallbacks.get(ws).size === 0) {
    nakCallbacks.delete(ws);
  }
}

export async function nak(ctx: Context) {
  const callback = nakCallbacks.get(ctx.ws)?.get(ctx.request.params._id);

  if (callback) {
    callback();
  }

  ctx.response.status = StatusCode.OK;
}

export function setNakCallback(_id: string, callback: NakCallback, ws: WebSocket) {
  if (!nakCallbacks.has(ws)) {
    nakCallbacks.set(ws, new Map());
  }

  nakCallbacks.get(ws).set(_id, callback);
}
