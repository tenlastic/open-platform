import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { MatchDocument } from '../match';

export interface MatchInvitation {
  _id: mongoose.Types.ObjectId;
  acceptedAt?: Date;
  createdAt?: Date;
  declinedAt?: Date;
  expiresAt: Date;
  matchId: mongoose.Types.ObjectId;
  namespaceId: mongoose.Types.ObjectId;
  queueId?: mongoose.Types.ObjectId;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
}

export type MatchInvitationDocument = mongoose.Document<mongoose.Types.ObjectId> & MatchInvitation;

export interface MatchInvitationModelType extends mongoose.Model<MatchInvitationDocument> {
  /**
   * Creates Match Invitations for the Match.
   */
  createForMatch(
    this: MatchInvitationModelType,
    match: MatchDocument,
  ): Promise<MatchInvitationDocument[]>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: MatchInvitationModelType, values?: Partial<MatchInvitation>): MatchInvitationDocument;
}

const MatchInvitationSchema = new mongoose.Schema<
  MatchInvitationDocument,
  MatchInvitationModelType
>(
  {
    acceptedAt: { type: Date },
    declinedAt: { type: Date },
    expiresAt: { required: true, type: Date },
    matchId: { ref: 'MatchSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    queueId: { ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'match-invitations', timestamps: true },
);

MatchInvitationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { acceptedAt: null } },
);
MatchInvitationSchema.index({ matchId: 1 });
MatchInvitationSchema.index({ namespaceId: 1 });
MatchInvitationSchema.index({ userId: 1 });

MatchInvitationSchema.plugin(duplicateKeyErrorPlugin);
MatchInvitationSchema.plugin(unsetPlugin);

MatchInvitationSchema.pre('validate', async function (this: MatchInvitationDocument) {
  const acceptedAtIsModified = this.isModified('acceptedAt');
  const declinedAtIsModified = this.isModified('declinedAt');

  if (acceptedAtIsModified && !this.acceptedAt) {
    this.invalidate('acceptedAt', new Error('Cannot unset acceptedAt.'), this.acceptedAt);
  }

  if (declinedAtIsModified && !this.declinedAt) {
    this.invalidate('declinedAt', new Error('Cannot unset declinedAt.'), this.declinedAt);
  }

  if (acceptedAtIsModified && !declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set acceptedAt if declinedAt is already set.';
    this.invalidate('acceptedAt', new Error(message), this.acceptedAt);
  }

  if (!acceptedAtIsModified && declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set declinedAt if acceptedAt is already set.';
    this.invalidate('declinedAt', new Error(message), this.declinedAt);
  }

  if (acceptedAtIsModified && declinedAtIsModified && this.acceptedAt && this.declinedAt) {
    const message = 'Cannot set declinedAt and acceptedAt at the same time.';
    this.invalidate('acceptedAt', new Error(message), this.acceptedAt);
    this.invalidate('declinedAt', new Error(message), this.declinedAt);
  }
});

MatchInvitationSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

MatchInvitationSchema.statics.createForMatch = async function (match: MatchDocument) {
  const { namespaceId, queueId } = match;

  let expiresAt = new Date(Date.now() + match.invitationSeconds * 1000);
  if (match.invitationsExpireAt && !match.startedAt) {
    expiresAt = match.invitationsExpireAt;
  }

  const values = { expiresAt, matchId: match._id, namespaceId, queueId };
  const matchInvitations = match.userIds.map((ui) => ({ ...values, userId: ui }));

  return this.create(matchInvitations);
};

MatchInvitationSchema.statics.mock = function (values: Partial<MatchInvitation> = {}) {
  const defaults: Partial<MatchInvitation> = {
    matchId: new mongoose.Types.ObjectId(),
    namespaceId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const MatchInvitationModel = mongoose.model<
  MatchInvitationDocument,
  MatchInvitationModelType
>('MatchInvitationSchema', MatchInvitationSchema);

export { MatchInvitationSchema };

export default MatchInvitationModel;
