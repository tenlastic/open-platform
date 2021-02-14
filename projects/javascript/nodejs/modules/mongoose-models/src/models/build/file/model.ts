import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildFileSchema {
  @prop({ required: true })
  public compressedBytes: number;

  @prop({ required: true })
  public md5: string;

  @prop({ required: true })
  public path: string;

  @prop({ required: true })
  public uncompressedBytes: number;
}

export type BuildFileDocument = DocumentType<BuildFileSchema>;
export type BuildFileModel = ReturnModelType<typeof BuildFileSchema>;
export const BuildFile = getModelForClass(BuildFileSchema);
