import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildEntrypointsSchema {
  @prop()
  public linux64: string;

  @prop()
  public mac64: string;

  @prop()
  public server64: string;

  @prop()
  public windows64: string;
}

export type BuildEntrypointsDocument = DocumentType<BuildEntrypointsSchema>;
export type BuildEntrypointsModel = ReturnModelType<typeof BuildEntrypointsSchema>;
export const BuildEntrypoints = getModelForClass(BuildEntrypointsSchema);
