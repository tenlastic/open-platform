import * as mongoose from 'mongoose';

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { arrayNullUndefinedValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';

export interface Group {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  namespaceId: mongoose.Types.ObjectId;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
  userIds: mongoose.Types.ObjectId[];
}

export type GroupDocument = mongoose.Document<mongoose.Types.ObjectId> & Group;

export interface GroupModelType extends mongoose.Model<GroupDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: GroupModelType, values?: Partial<Group>): GroupDocument;
}

const GroupSchema = new mongoose.Schema<GroupDocument, GroupModelType>(
  {
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    userIds: {
      ref: 'UserSchema',
      required: true,
      type: [mongoose.Schema.Types.ObjectId],
      validate: arrayNullUndefinedValidator,
    },
  },
  { collation, collection: 'groups', timestamps: true },
);

GroupSchema.index(
  { name: 1, namespaceId: 1 },
  { collation, partialFilterExpression: { name: { $exists: true } }, unique: true },
);
GroupSchema.index({ namespaceId: 1, userIds: 1 }, { unique: true });

GroupSchema.plugin(duplicateKeyErrorPlugin);
GroupSchema.plugin(unsetPlugin);

GroupSchema.pre('validate', function (this: GroupDocument) {
  if (this.userIds.length > 0 && !this.userIds.some((ui) => ui.equals(this.userId))) {
    const message = 'User IDs must include the User ID.';
    this.invalidate('userId', message, this.userId);
  }
});

GroupSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

GroupSchema.statics.mock = function (values: Partial<Group> = {}) {
  const userId = new mongoose.Types.ObjectId();

  const defaults: Partial<Group> = {
    namespaceId: new mongoose.Types.ObjectId(),
    userId,
    userIds: [userId],
  };

  return new this({ ...defaults, ...values });
};

export const GroupModel = mongoose.model<GroupDocument, GroupModelType>('GroupSchema', GroupSchema);

export { GroupSchema };

export default GroupModel;
