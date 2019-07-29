import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose } from 'typegoose';

export class RecordSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;
}

export type RecordDocument = InstanceType<RecordSchema>;
export type RecordModel = ModelType<RecordSchema>;
export const Record = new RecordSchema().getModelForClass(RecordSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'records',
    timestamps: true,
  },
});
