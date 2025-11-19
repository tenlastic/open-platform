import { ArticleModel } from '@tenlastic/mongoose';
import { ArticleEvent, log, NamespaceEvent } from '@tenlastic/mongoose-nats';

// Log the message.
ArticleEvent.sync(log);

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  if (payload.operationType === 'delete') {
    await ArticleModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
