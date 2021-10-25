import { GameServer, GameServerDocument } from '@tenlastic/mongoose-models';

import { subscribe } from '../subscribe';
import { KubernetesGameServer, KubernetesGameServerSidecar } from '../models';

export function gameServers() {
  return subscribe<GameServerDocument>(GameServer, 'game-server', async payload => {
    if (payload.operationType === 'delete') {
      console.log(`Deleting Game Server: ${payload.fullDocument._id}.`);
      await KubernetesGameServer.delete(payload.fullDocument);

      console.log(`Deleting Game Server Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesGameServerSidecar.delete(payload.fullDocument);
    } else if (
      payload.operationType === 'insert' ||
      GameServer.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
    ) {
      console.log(`Upserting Game Server: ${payload.fullDocument._id}.`);
      await KubernetesGameServer.delete(payload.fullDocument);
      await KubernetesGameServer.upsert(payload.fullDocument);

      console.log(`Upserting Game Server Sidecar: ${payload.fullDocument._id}.`);
      await KubernetesGameServerSidecar.upsert(payload.fullDocument);
    }
  });
}
