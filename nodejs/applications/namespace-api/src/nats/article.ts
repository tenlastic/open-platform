import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose';

import { Article, ArticleDocument } from '../mongodb';
import { NamespaceEvent } from './namespace';

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      return Article.deleteMany({ namespaceId: payload.fullDocument._id });
  }
});
