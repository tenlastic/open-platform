import { Document } from 'mongoose';

import { DatabasePayload } from './database-payload';

export function log(payload: DatabasePayload<Document>) {
  const { documentKey, ns, operationType } = payload;
  console.log({ documentKey, ns, operationType });
}
