import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { GroupDocument } from '../group';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ fromUserId: 1 })
@index({ groupId: 1, toUserId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'group-invitations', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('validate', function (this: GroupInvitationDocument) {
  if (!this.isNew) {
    return;
  }

  // Set the expiration date to 1 minute in the future.
  const date = new Date();
  date.setTime(date.getTime() + 1 * 60 * 1000);
  this.expiresAt = date;
})
export class GroupInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: Date })
  public expiresAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public fromUserId: mongoose.Types.ObjectId;

  @prop({ ref: 'GroupSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public groupId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public toUserId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: 'GroupSchema' })
  public groupDocument: GroupDocument;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: GroupInvitationModel, values: Partial<GroupInvitationSchema> = {}) {
    const defaults = {
      fromUserId: new mongoose.Types.ObjectId(),
      groupId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GroupInvitationDocument = DocumentType<GroupInvitationSchema>;
export type GroupInvitationModel = ReturnModelType<typeof GroupInvitationSchema>;
export const GroupInvitation = getModelForClass(GroupInvitationSchema);
