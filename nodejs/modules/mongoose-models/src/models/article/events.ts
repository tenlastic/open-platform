import { EventEmitter, IDatabasePayload } from '../../change-stream';
import { OnNamespaceConsumed } from '../namespace';
import { Article, ArticleDocument } from './model';

export const OnArticleConsumed = new EventEmitter<IDatabasePayload<ArticleDocument>>();

// Delete Articles if associated Namespace is deleted.
OnNamespaceConsumed.async(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Article.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});
