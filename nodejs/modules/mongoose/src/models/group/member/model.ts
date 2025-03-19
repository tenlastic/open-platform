import { DocumentType, getModelForClass, prop } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

export class GroupMemberSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ ref: 'WebSocketSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public webSocketId: mongoose.Types.ObjectId;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GroupMemberModel, values: Partial<GroupMemberSchema> = {}) {
    const defaults = {
      userId: new mongoose.Types.ObjectId(),
      webSocketId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GroupMemberDocument = DocumentType<GroupMemberSchema>;
export const GroupMemberModel = getModelForClass(GroupMemberSchema);
