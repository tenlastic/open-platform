import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, arrayProp, prop } from 'typegoose';

export class ReadonlyUserSchema extends Typegoose {
  @prop()
  public _id: mongoose.Types.ObjectId;

  @prop()
  public createdAt: Date;

  @prop()
  public email: string;

  @prop()
  public password: string;

  @arrayProp({ items: String })
  public roles: string[];

  @prop()
  public updatedAt: Date;

  @prop()
  public username: string;
}

export type ReadonlyUserDocument = InstanceType<ReadonlyUserSchema>;
export type ReadonlyUserModel = ModelType<ReadonlyUserSchema>;
export const ReadonlyUser = new ReadonlyUserSchema().getModelForClass(ReadonlyUserSchema, {
  schemaOptions: {
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'readonly.users',
    minimize: false,
  },
});
