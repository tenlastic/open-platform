import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { DatabaseStatusComponentSchema } from './component';
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
  @prop({ type: DatabaseStatusComponentSchema })
  public components: DatabaseStatusComponentSchema[];

  @prop({ type: DatabaseStatusNodeSchema })
  public nodes: DatabaseStatusNodeSchema[];

  @prop({ enum: DatabaseStatusPhase, required: true })
  public phase: DatabaseStatusPhase;

  @prop()
  public version: string;
}

export type DatabaseStatusDocument = DocumentType<DatabaseStatusSchema>;
export type DatabaseStatusModel = ReturnModelType<typeof DatabaseStatusSchema>;
export const DatabaseStatus = getModelForClass(DatabaseStatusSchema);
