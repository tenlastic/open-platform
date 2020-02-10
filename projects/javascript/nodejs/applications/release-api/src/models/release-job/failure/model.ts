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
export class ReleaseJobFailureSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public message: string;

  public updatedAt: Date;
}

export type ReleaseJobFailureDocument = DocumentType<ReleaseJobFailureSchema>;
export type ReleaseJobFailureModel = ReturnModelType<typeof ReleaseJobFailureSchema>;
export const ReleaseJobFailure = getModelForClass(ReleaseJobFailureSchema);
