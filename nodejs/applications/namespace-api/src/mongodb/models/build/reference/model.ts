import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildReferenceSchema {
  @prop({ ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public _id: mongoose.Types.ObjectId;

  @prop({ type: String }, PropType.ARRAY)
  public files: string[];
}

export type BuildReferenceDocument = DocumentType<BuildReferenceSchema>;
export type BuildReferenceModel = ReturnModelType<typeof BuildReferenceSchema>;
export const BuildReference = getModelForClass(BuildReferenceSchema);
