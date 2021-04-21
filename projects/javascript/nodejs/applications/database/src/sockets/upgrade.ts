import { WebSocket } from '@tenlastic/mongoose-models';

export function upgrade(auth) {
  if (!auth.jwt || !auth.jwt.jti || !auth.jwt.user) {
    return;
  }

  return WebSocket.create({ refreshTokenId: auth.jwt.jti, userId: auth.jwt.user._id });
}
