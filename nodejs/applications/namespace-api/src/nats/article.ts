import { ArticleModel } from '@tenlastic/mongoose';
import { NamespaceEvent } from '@tenlastic/mongoose-nats';

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return ArticleModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
