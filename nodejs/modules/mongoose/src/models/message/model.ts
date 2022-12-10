import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import {
  MessageReadReceiptDocument,
  MessageReadReceiptModel,
  MessageReadReceiptSchema,
} from './read-receipt';

@index({ fromUserId: 1 })
@index({ 'readReceipts.userId': 1 })
@index({ toGroupId: 1 })
@index({ toUserId: 1 })
@modelOptions({ schemaOptions: { collection: 'messages', timestamps: true } })
@plugin(unsetPlugin)
@pre('validate', function (this: MessageDocument) {
  if (this.fromUserId === this.toUserId) {
    const message = 'Messages must be sent between two different Users.';
    this.invalidate('fromUserId', message, this.fromUserId);
    this.invalidate('toUserId', message, this.toUserId);
  } else if (this.toGroupId && this.toUserId) {
    const message = 'Only one of the following fields must be specified: toGroupId or toUserId.';
    this.invalidate('toGroupId', message, this.toGroupId);
    this.invalidate('toUserId', message, this.toUserId);
  } else if (!this.toGroupId && !this.toUserId) {
    const message = 'One of the following fields must be specified: toGroupId or toUserId.';
    this.invalidate('toGroupId', message, this.toGroupId);
    this.invalidate('toUserId', message, this.toUserId);
  }
})
export class MessageSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 512, required: true, trim: true, type: String })
  public body: string;

  public createdAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public fromUserId: mongoose.Types.ObjectId;

  @prop(
    {
      default(this: MessageDocument) {
        const readReceipt = new MessageReadReceiptModel({ userId: this.fromUserId });
        return [readReceipt];
      },
      type: MessageReadReceiptSchema,
      writable: false,
    },
    PropType.ARRAY,
  )
  public readReceipts: MessageReadReceiptDocument[];

  @prop({ ref: 'GroupSchema', type: mongoose.Schema.Types.ObjectId })
  public toGroupId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId })
  public toUserId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof MessageModel, values: Partial<MessageSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      body: chance.hash(),
      fromUserId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type MessageDocument = DocumentType<MessageSchema>;
export const MessageModel = getModelForClass(MessageSchema);
