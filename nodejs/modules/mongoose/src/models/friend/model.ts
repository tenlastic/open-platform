import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'friends', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class FriendSchema {
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
  public static mock(this: typeof FriendModel, values: Partial<FriendSchema> = {}) {
    const defaults = {
      fromUserId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type FriendDocument = DocumentType<FriendSchema>;
export const FriendModel = getModelForClass(FriendSchema, { existingMongoose: mongoose });
