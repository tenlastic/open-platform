import {
  EventEmitter,
  GameServerModel,
  IDatabasePayload,
  MatchDocument,
  MatchModel,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const MatchEvent = new EventEmitter<IDatabasePayload<MatchDocument>>();

// Creates a Game Server when a Match is inserted.
MatchEvent.async(async (payload) => {
  const match = payload.fullDocument;

  if (payload.operationType === 'insert') {
    await GameServerModel.create({
      _id: match.gameServerId,
      authorizedUserIds: match.userIds,
      buildId: match.gameServerTemplate.buildId,
      cpu: match.gameServerTemplate.cpu,
      description: match.gameServerTemplate.description,
      memory: match.gameServerTemplate.memory,
      metadata: match.gameServerTemplate.metadata,
      name: match.gameServerTemplate.name,
      namespaceId: match.namespaceId,
      persistent: false,
      ports: match.gameServerTemplate.ports,
      preemptible: match.gameServerTemplate.preemptible,
      probes: match.gameServerTemplate.probes,
    });
  }
});

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
