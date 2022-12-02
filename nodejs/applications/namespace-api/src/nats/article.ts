import { ArticleDocument, ArticleModel, EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { NamespaceEvent } from './namespace';

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return ArticleModel.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
