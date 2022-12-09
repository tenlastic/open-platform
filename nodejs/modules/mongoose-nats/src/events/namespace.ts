import { NamespaceDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const GlobalNamespaceEvent = new EventEmitter<DatabasePayload<NamespaceDocument>>();
export const NamespaceEvent = new EventEmitter<DatabasePayload<NamespaceDocument>>();
export const NamespaceStorageLimitEvent = new EventEmitter<NamespaceDocument>();

GlobalNamespaceEvent.async(async (payload) => {
  const limit = payload.fullDocument.limits.storage;
  const status = payload.fullDocument.status.limits.storage;

  if (payload.updateDescription?.updatedFields?.status.limits.storage && status > limit) {
    await NamespaceStorageLimitEvent.emit(payload.fullDocument);
  }
});
