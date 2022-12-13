import {
  GameServerModel,
  GameServerStatusComponentName,
  MatchModel,
  QueueModel,
} from '@tenlastic/mongoose';
import { GameServerEvent, MatchEvent, NamespaceEvent, QueueEvent } from '@tenlastic/mongoose-nats';

import { KubernetesGameServer, KubernetesGameServerSidecar } from '../kubernetes';

// Delete Game Server if Failed or Succeeded.
GameServerEvent.async(async (payload) => {
  if (payload.operationType !== 'update' || payload.fullDocument.persistent) {
    return;
  }

  const component = GameServerStatusComponentName.Application;
  const node = payload.fullDocument.status.nodes.find((n) => n.component === component);

  if (node?.phase === 'Failed' || node?.phase === 'Succeeded') {
    await payload.fullDocument.remove();
  }
});

// Create, delete, and update Kubernetes resources.
GameServerEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await KubernetesGameServer.delete(payload.fullDocument);
    await KubernetesGameServerSidecar.delete(payload.fullDocument);
  } else if (
    payload.operationType === 'insert' ||
    GameServerModel.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    const match = payload.fullDocument.matchId
      ? await MatchModel.findOne({ _id: payload.fullDocument.matchId })
      : null;

    await KubernetesGameServer.upsert(payload.fullDocument, match);
    await KubernetesGameServerSidecar.upsert(payload.fullDocument);
  }
});

// Deletes a Game Server when its Match is deleted.
// Creates a Game Server when a Match without confirmation is inserted.
// Creates a Game Server when a Match with confirmation is started.
MatchEvent.async(async (payload) => {
  const { _id, confirmationExpiresAt, namespaceId, queueId, startedAt } = payload.fullDocument;

  if (payload.operationType === 'delete') {
    await GameServerModel.deleteMany({ matchId: _id });
  } else if (
    (payload.operationType === 'insert' && !confirmationExpiresAt) ||
    (payload.operationType === 'update' && confirmationExpiresAt && startedAt)
  ) {
    const queue = await QueueModel.findOne({ _id: queueId });

    await GameServerModel.create({
      authorizedUserIds: payload.fullDocument.userIds,
      buildId: queue.gameServerTemplate.buildId,
      cpu: queue.gameServerTemplate.cpu,
      description: queue.gameServerTemplate.description,
      matchId: _id,
      memory: queue.gameServerTemplate.memory,
      metadata: queue.gameServerTemplate.metadata,
      name: queue.gameServerTemplate.name,
      namespaceId,
      ports: queue.gameServerTemplate.ports,
      preemptible: queue.gameServerTemplate.preemptible,
      probes: queue.gameServerTemplate.probes,
      queueId,
    });
  }
});

// Delete Game Servers if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GameServerModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});

// Delete Game Servers if associated Queue is deleted.
QueueEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GameServerModel.deleteMany({ 'match.queueId': payload.fullDocument._id });
  }
});
