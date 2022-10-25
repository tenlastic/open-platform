import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { QueueMember, QueueMemberDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMembers if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return QueueMember.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
