import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({
  schemaOptions: {
    _id: false,
    minimize: false,
    timestamps: true,
  },
})
export class BuildTaskFailureSchema {
  @prop()
  public createdAt: Date;

  @prop({ required: true })
  public message: string;
}

export type BuildTaskFailureDocument = DocumentType<BuildTaskFailureSchema>;
export type BuildTaskFailureModel = ReturnModelType<typeof BuildTaskFailureSchema>;
export const BuildTaskFailure = getModelForClass(BuildTaskFailureSchema);
