import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@index({ email: 1 })
@index({ username: 1 }, { collation: { locale: 'en_US', strength: 1 } })
@modelOptions({
  schemaOptions: {
    collation: { locale: 'en_US', strength: 1 },
    collection: 'users',
    minimize: false,
    timestamps: true,
  },
})
export class UserSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;
}

export type UserDocument = DocumentType<UserSchema>;
export type UserModel = ReturnModelType<typeof UserSchema>;
export const User = getModelForClass(UserSchema);
