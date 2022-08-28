import { EventEmitter, IDatabasePayload } from '../change-stream';
import { GameServer, GameServerDocument } from '../models';
import { NamespaceEvent } from './namespace';
import { QueueEvent } from './queue';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();

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
