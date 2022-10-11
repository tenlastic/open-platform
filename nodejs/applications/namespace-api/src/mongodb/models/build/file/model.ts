import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildFileSchema {
  @prop({ required: true, type: Number })
  public compressedBytes: number;

  @prop({ required: true, type: String })
  public md5: string;

  @prop({ required: true, type: String })
  public path: string;

  @prop({ required: true, type: Number })
  public uncompressedBytes: number;
}

export type BuildFileDocument = DocumentType<BuildFileSchema>;
export type BuildFileModel = ReturnModelType<typeof BuildFileSchema>;
export const BuildFile = getModelForClass(BuildFileSchema);
