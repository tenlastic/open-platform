import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({
  schemaOptions: {
    _id: false,
    minimize: false,
    timestamps: true,
  },
})
export class BuildTaskFailureSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public message: string;

  public updatedAt: Date;
}

export type BuildTaskFailureDocument = DocumentType<BuildTaskFailureSchema>;
export type BuildTaskFailureModel = ReturnModelType<typeof BuildTaskFailureSchema>;
export const BuildTaskFailure = getModelForClass(BuildTaskFailureSchema);
