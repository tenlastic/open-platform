import { EventEmitter, IDatabasePayload, MatchDocument, MatchModel } from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const MatchEvent = new EventEmitter<IDatabasePayload<MatchDocument>>();

// Delete Matches if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return MatchModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
