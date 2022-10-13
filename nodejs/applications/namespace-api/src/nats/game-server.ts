import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { KubernetesGameServer, KubernetesGameServerSidecar } from '../kubernetes';
import { GameServer, GameServerDocument, GameServerStatusComponentName } from '../mongodb';
import { NamespaceEvent } from './namespace';
import { QueueEvent } from './queue';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();

// Delete Game Server if Failed or Succeeded.
GameServerEvent.async(async (payload) => {
  if (payload.operationType !== 'update' || payload.fullDocument.persistent) {
    return;
  }

  const component = GameServerStatusComponentName.Application;
  const node = payload.fullDocument.status?.nodes?.find((n) => n.component === component);

  if (node?.phase === 'Failed' || node?.phase === 'Succeeded') {
    await payload.fullDocument.remove();
  }
});

// Delete Kubernetes resources.
GameServerEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesGameServer.delete(payload.fullDocument);
    await KubernetesGameServerSidecar.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    GameServer.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    await KubernetesGameServer.upsert(payload.fullDocument);
    await KubernetesGameServerSidecar.upsert(payload.fullDocument);
  }
});

// Delete Game Servers if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Game Servers if associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ queueId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});