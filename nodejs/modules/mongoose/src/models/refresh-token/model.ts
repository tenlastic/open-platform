import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: { collection: 'refresh-tokens', minimize: false, timestamps: true },
})
export class RefreshTokenSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: String })
  public description: string;

  @prop({ required: true, type: Date })
  public expiresAt: Date;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: RefreshTokenModel, values: Partial<RefreshTokenSchema> = {}) {
    const defaults = { expiresAt: new Date(), userId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export type RefreshTokenModel = ReturnModelType<typeof RefreshTokenSchema>;
export const RefreshToken = getModelForClass(RefreshTokenSchema);
