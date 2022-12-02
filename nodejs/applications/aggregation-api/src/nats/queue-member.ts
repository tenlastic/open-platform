import {
  EventEmitter,
  IDatabasePayload,
  QueueMemberDocument,
  QueueMemberModel,
} from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMembers if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMemberModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
