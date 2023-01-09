import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';
import { unsetPlugin } from '../../plugins';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'refresh-tokens', timestamps: true } })
@plugin(unsetPlugin)
export class RefreshTokenSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: Date })
  public expiresAt: Date;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof RefreshTokenModel, values: Partial<RefreshTokenSchema> = {}) {
    const defaults = { expiresAt: new Date(), userId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export const RefreshTokenModel = getModelForClass(RefreshTokenSchema, {
  existingMongoose: mongoose,
});
