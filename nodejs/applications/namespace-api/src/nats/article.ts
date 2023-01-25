import { ArticleModel } from '@tenlastic/mongoose';
import { ArticleEvent, log, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
ArticleEvent.sync(log);

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return ArticleModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
