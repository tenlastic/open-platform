import { EventEmitter, IDatabasePayload } from '../change-stream';
import { Article, ArticleDocument } from '../models';
import { NamespaceEvent } from './namespace';

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Article.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
