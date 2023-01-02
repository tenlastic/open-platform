import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class MessageReadReceiptSchema {
  @prop({ default: () => new Date(), type: Date })
  public createdAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof MessageReadReceiptModel,
    values: Partial<MessageReadReceiptSchema> = {},
  ) {
    const defaults = { userId: new mongoose.Types.ObjectId() };
    return new this({ ...defaults, ...values });
  }
}

export type MessageReadReceiptDocument = DocumentType<MessageReadReceiptSchema>;
export const MessageReadReceiptModel = getModelForClass(MessageReadReceiptSchema);
