import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { OnQueueConsumed } from '../queue';
import { GameServer, GameServerDocument } from './model';

export const OnGameServerConsumed = new EventEmitter<IDatabasePayload<GameServerDocument>>();

// Delete Game Servers if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Game Servers if associated Queue is deleted.
OnQueueConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ queueId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
