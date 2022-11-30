import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'ignorations', minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class IgnorationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public fromUserId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public toUserId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: IgnorationModel, values: Partial<IgnorationSchema> = {}) {
    const defaults = {
      fromUserId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type IgnorationDocument = DocumentType<IgnorationSchema>;
export type IgnorationModel = ReturnModelType<typeof IgnorationSchema>;
export const Ignoration = getModelForClass(IgnorationSchema);
