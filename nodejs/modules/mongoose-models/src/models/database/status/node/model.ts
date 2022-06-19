import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { DatabaseStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class DatabaseStatusNodeSchema {
  @prop({ required: true })
  public _id: string;

  @prop({ enum: DatabaseStatusPhase, required: true })
  public phase: DatabaseStatusPhase;
}

export type DatabaseStatusNodeDocument = DocumentType<DatabaseStatusNodeSchema>;
export type DatabaseStatusNodeModel = ReturnModelType<typeof DatabaseStatusNodeSchema>;
export const DatabaseStatusNode = getModelForClass(DatabaseStatusNodeSchema);
