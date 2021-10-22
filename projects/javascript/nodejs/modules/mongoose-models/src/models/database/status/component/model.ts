import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { DatabaseStatusPhase } from '../model';

export enum DatabaseStatusComponentName {
  Application = 'application',
  MongoDB = 'mongodb',
  NATS = 'nats',
  Sidecar = 'sidecar',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class DatabaseStatusComponentSchema {
  @prop({ default: 0 })
  public current: number;

  @prop({ enum: DatabaseStatusComponentName, required: true })
  public name: DatabaseStatusComponentName;

  @prop({ enum: DatabaseStatusPhase, required: true })
  public phase: DatabaseStatusPhase;

  @prop({ required: true })
  public total: number;
}

export type DatabaseStatusComponentDocument = DocumentType<DatabaseStatusComponentSchema>;
export type DatabaseStatusComponentModel = ReturnModelType<typeof DatabaseStatusComponentSchema>;
export const DatabaseStatusComponent = getModelForClass(DatabaseStatusComponentSchema);
