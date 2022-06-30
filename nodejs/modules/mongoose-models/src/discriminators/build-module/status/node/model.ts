import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { Phase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NodeSchema {
  @prop({ required: true })
  public _id: string;

  @prop({ enum: Phase, required: true })
  public phase: Phase;
}

export type NodeDocument = DocumentType<NodeSchema>;
export type NodeModel = ReturnModelType<typeof NodeSchema>;
export const Node = getModelForClass(NodeSchema);
