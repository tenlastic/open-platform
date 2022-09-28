import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { Article, ArticleDocument } from '../mongodb';
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
