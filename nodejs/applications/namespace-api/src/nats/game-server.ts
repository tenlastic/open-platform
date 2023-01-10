import {
  GameServerModel,
  GameServerStatusComponentName,
  GameServerTemplateModel,
  MatchModel,
} from '@tenlastic/mongoose';
import { GameServerEvent, MatchEvent, NamespaceEvent, QueueEvent } from '@tenlastic/mongoose-nats';

import { KubernetesGameServer } from '../kubernetes';

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
  } else if (
    payload.operationType === 'insert' ||
    GameServerModel.isRestartRequired(Object.keys(payload.updateDescription.updatedFields))
  ) {
    const match = payload.fullDocument.matchId
      ? await MatchModel.findOne({ _id: payload.fullDocument.matchId })
      : null;

    await KubernetesGameServer.upsert(payload.fullDocument, match);
  }
});

// Deletes a Game Server when its Match is deleted.
// Creates a Game Server when a Match without confirmation is inserted.
// Creates a Game Server when a Match with confirmation is started.
MatchEvent.async(async (payload) => {
  const { confirmationExpiresAt, gameServerTemplateId, startedAt } = payload.fullDocument;
  const updatedFields = payload.updateDescription?.updatedFields;

  if (payload.operationType === 'delete') {
    await GameServerModel.deleteMany({ matchId: payload.fullDocument._id });
  } else if (
    (payload.operationType === 'insert' && !confirmationExpiresAt && startedAt) ||
    (payload.operationType === 'update' && confirmationExpiresAt && updatedFields.startedAt)
  ) {
    const gameServerTemplate = await GameServerTemplateModel.findOne({ _id: gameServerTemplateId });

    await GameServerModel.create({
      authorizedUserIds: payload.fullDocument.userIds,
      buildId: gameServerTemplate.buildId,
      cpu: gameServerTemplate.cpu,
      description: gameServerTemplate.description,
      matchId: payload.fullDocument._id,
      memory: gameServerTemplate.memory,
      metadata: gameServerTemplate.metadata,
      name: gameServerTemplate.name,
      namespaceId: payload.fullDocument.namespaceId,
      ports: gameServerTemplate.ports,
      preemptible: gameServerTemplate.preemptible,
      probes: gameServerTemplate.probes,
      queueId: payload.fullDocument.queueId,
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
      return GameServerModel.deleteMany({
        queueId: { $eq: payload.fullDocument._id, $exists: true },
      });
  }
});
