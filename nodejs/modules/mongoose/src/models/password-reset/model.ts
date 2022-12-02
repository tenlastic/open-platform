import {
  DocumentType,
  getModelForClass,
  index,
  plugin,
  prop,
  modelOptions,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ hash: 1 }, { unique: true })
@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'password-resets', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class PasswordResetSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: Date })
  public expiresAt: Date;

  @prop({ maxlength: 128, required: true, trim: true, type: String })
  public hash: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof PasswordResetModel, values: Partial<PasswordResetSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      hash: chance.hash({ length: 128 }),
      userId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type PasswordResetDocument = DocumentType<PasswordResetSchema>;
export const PasswordResetModel = getModelForClass(PasswordResetSchema);
