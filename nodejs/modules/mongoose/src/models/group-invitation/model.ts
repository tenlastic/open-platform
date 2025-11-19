import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { GroupDocument } from '../group';

export interface GroupInvitation {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  expiresAt: Date;
  fromUserId: mongoose.Types.ObjectId;
  groupDocument?: GroupDocument;
  groupId: mongoose.Types.ObjectId;
  namespaceId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

export type GroupInvitationDocument = mongoose.Document<mongoose.Types.ObjectId> & GroupInvitation;

export interface GroupInvitationModelType extends mongoose.Model<GroupInvitationDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: GroupInvitationModelType, values?: Partial<GroupInvitation>): GroupInvitationDocument;
}

const GroupInvitationSchema = new mongoose.Schema<
  GroupInvitationDocument,
  GroupInvitationModelType
>(
  {
    expiresAt: { required: true, type: Date },
    fromUserId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    groupId: { ref: 'GroupSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    toUserId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'group-invitations', timestamps: true },
);

GroupInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
GroupInvitationSchema.index({ fromUserId: 1 });
GroupInvitationSchema.index({ groupId: 1, namespaceId: 1, toUserId: 1 }, { unique: true });

GroupInvitationSchema.plugin(duplicateKeyErrorPlugin);
GroupInvitationSchema.plugin(unsetPlugin);

GroupInvitationSchema.pre('validate', function (this: GroupInvitationDocument) {
  if (!this.isNew) {
    return;
  }

  // Set the expiration date to 1 minute in the future.
  const date = new Date();
  date.setTime(date.getTime() + 1 * 60 * 1000);
  this.expiresAt = date;
});

GroupInvitationSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

GroupInvitationSchema.virtual('groupDocument', {
  foreignField: '_id',
  justOne: true,
  localField: 'groupId',
  ref: 'GroupSchema',
});

GroupInvitationSchema.statics.mock = function (values: Partial<GroupInvitation> = {}) {
  const defaults: Partial<GroupInvitation> = {
    fromUserId: new mongoose.Types.ObjectId(),
    groupId: new mongoose.Types.ObjectId(),
    toUserId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const GroupInvitationModel = mongoose.model<
  GroupInvitationDocument,
  GroupInvitationModelType
>('GroupInvitationSchema', GroupInvitationSchema);

export { GroupInvitationSchema };

export default GroupInvitationModel;
