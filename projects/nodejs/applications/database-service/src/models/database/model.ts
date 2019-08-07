import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, prop } from 'typegoose';

@index({ name: 1 }, { unique: true })
export class DatabaseSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public userId: string;
}

export type DatabaseDocument = InstanceType<DatabaseSchema>;
export type DatabaseModel = ModelType<DatabaseSchema>;
export const Database = new DatabaseSchema().getModelForClass(DatabaseSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'databases',
    timestamps: true,
  },
});
