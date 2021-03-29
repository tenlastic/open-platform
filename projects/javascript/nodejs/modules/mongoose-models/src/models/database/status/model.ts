import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { DatabaseStatusNodeSchema } from './node';

export enum DatabaseStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class DatabaseStatusSchema {
  @arrayProp({ items: DatabaseStatusNodeSchema })
  public nodes: DatabaseStatusNodeSchema[];

  @prop({ enum: DatabaseStatusPhase, required: true })
  public phase: DatabaseStatusPhase;
}

export type DatabaseStatusDocument = DocumentType<DatabaseStatusSchema>;
export type DatabaseStatusModel = ReturnModelType<typeof DatabaseStatusSchema>;
export const DatabaseStatus = getModelForClass(DatabaseStatusSchema);
