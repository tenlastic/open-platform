import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

@index({ email: 1 })
@index({ roles: 1 })
@index({ username: 1 })
@modelOptions({
  schemaOptions: {
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'readonly.users',
    minimize: false,
  },
})
export class ReadonlyUserSchema {
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

export type ReadonlyUserDocument = DocumentType<ReadonlyUserSchema>;
export type ReadonlyUserModel = ReturnModelType<typeof ReadonlyUserSchema>;
export const ReadonlyUser = getModelForClass(ReadonlyUserSchema);
