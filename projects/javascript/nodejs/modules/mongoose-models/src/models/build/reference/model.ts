import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  mongoose,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildReferenceSchema {
  @prop({ ref: 'BuildSchema', required: true })
  public _id: mongoose.Types.ObjectId;

  @prop({ type: String })
  public files: string[];
}

export type BuildReferenceDocument = DocumentType<BuildReferenceSchema>;
export type BuildReferenceModel = ReturnModelType<typeof BuildReferenceSchema>;
export const BuildReference = getModelForClass(BuildReferenceSchema);
