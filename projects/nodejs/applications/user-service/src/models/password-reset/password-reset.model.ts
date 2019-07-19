import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, prop } from 'typegoose';

@index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
@index({ hash: 1 })
export class PasswordResetSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    required: true,
  })
  public hash: string;

  public updatedAt: Date;

  @prop({
    required: true,
  })
  public userId: mongoose.Types.ObjectId;
}

export type PasswordResetDocument = InstanceType<PasswordResetSchema>;
export type PasswordResetModel = ModelType<PasswordResetSchema>;
export const PasswordReset = new PasswordResetSchema().getModelForClass(PasswordResetSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'passwordresets',
    timestamps: true,
  },
});
