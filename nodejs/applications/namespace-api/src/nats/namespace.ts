import { EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';

import { NamespaceDocument } from '../mongodb';

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
export const GlobalNamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();
export const NamespaceStorageLimitEvent = new EventEmitter<NamespaceDocument>();

GlobalNamespaceEvent.async(async (payload) => {
  const limit = payload.fullDocument.limits?.storage;
  const status = payload.fullDocument.status?.limits?.storage;

  if (payload.updateDescription?.updatedFields?.status?.limits?.storage && status > limit) {
    await NamespaceStorageLimitEvent.emit(payload.fullDocument);
  }
});
