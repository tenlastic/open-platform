import { GameServerTemplateModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Game Server Templates if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return GameServerTemplateModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
