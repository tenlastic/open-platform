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
export class ReleaseTaskFailureSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public message: string;

  public updatedAt: Date;
}

export type ReleaseTaskFailureDocument = DocumentType<ReleaseTaskFailureSchema>;
export type ReleaseTaskFailureModel = ReturnModelType<typeof ReleaseTaskFailureSchema>;
export const ReleaseTaskFailure = getModelForClass(ReleaseTaskFailureSchema);
