import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { DatabaseStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class DatabaseStatusNodeSchema {
  @prop({ required: true })
  public name: string;

  @prop({ enum: DatabaseStatusPhase, required: true })
  public phase: DatabaseStatusPhase;
}

export type DatabaseStatusNodeDocument = DocumentType<DatabaseStatusNodeSchema>;
export type DatabaseStatusNodeModel = ReturnModelType<typeof DatabaseStatusNodeSchema>;
export const DatabaseStatusNode = getModelForClass(DatabaseStatusNodeSchema);
