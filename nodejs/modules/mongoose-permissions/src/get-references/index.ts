import * as mongoose from 'mongoose';

import { ICredentials, IReferences } from '../types';

/**
 * Gets the query references.
 */
export function getReferences<TDocument extends mongoose.Document>(
  credentials: ICredentials,
  record?: TDocument,
): IReferences<TDocument> {
  return {
    apiKey: credentials.apiKey ?? null,
    authorization: credentials.authorization ?? null,
    now: new Date(),
    record: record ?? null,
    user: credentials.user ?? null,
  };
}
