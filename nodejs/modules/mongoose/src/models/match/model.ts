import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { arrayLengthValidator, arrayNullUndefinedValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';
import { MatchTeamDocument, MatchTeamModel, MatchTeamSchema } from './team';

export interface Match {
  _id: mongoose.Types.ObjectId;
  acceptedUserIds?: mongoose.Types.ObjectId[];
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  declinedUserIds?: mongoose.Types.ObjectId[];
  finishedAt?: Date;
  gameServerTemplateId: mongoose.Types.ObjectId;
  invitationSeconds?: number;
  invitationsExpireAt?: Date;
  namespaceId: mongoose.Types.ObjectId;
  queueId?: mongoose.Types.ObjectId;
  startedAt?: Date;
  teams: MatchTeamDocument[];
  updatedAt?: Date;
  userIds?: mongoose.Types.ObjectId[];
}

export type MatchDocument = mongoose.Document<mongoose.Types.ObjectId> & Match;

export interface MatchModelType extends mongoose.Model<MatchDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: MatchModelType, values?: Partial<Match>): MatchDocument;
}

const MatchSchema = new mongoose.Schema<MatchDocument, MatchModelType>(
  {
    acceptedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserSchema' }],
    declinedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserSchema' }],
    finishedAt: { type: Date },
    gameServerTemplateId: {
      ref: 'GameServerTemplateSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    invitationSeconds: { default: 30, min: 0, type: Number },
    invitationsExpireAt: { type: Date },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    queueId: { ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId },
    startedAt: { type: Date },
    teams: {
      required: true,
      type: [MatchTeamSchema],
      validate: [arrayLengthValidator(Infinity, 1), arrayNullUndefinedValidator],
    },
  },
  { collection: 'matches', timestamps: true },
);

MatchSchema.index(
  { invitationsExpireAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { startedAt: null } },
);
MatchSchema.index(
  { namespaceId: 1, 'teams.userIds': 1 },
  { partialFilterExpression: { finishedAt: null }, unique: true },
);
MatchSchema.index({ queueId: 1 });

MatchSchema.plugin(duplicateKeyErrorPlugin);
MatchSchema.plugin(unsetPlugin);

MatchSchema.pre('save', async function (this: MatchDocument) {
  if (this.isNew && !this.invitationsExpireAt) {
    this.startedAt = this.createdAt;
  }
});

MatchSchema.pre('validate', async function (this: MatchDocument) {
  if (this.finishedAt && !this.startedAt) {
    const message = 'A Match cannot be finished before it is started.';
    this.invalidate('finishedAt', message, this.finishedAt);
    this.invalidate('startedAt', message, this.startedAt);
  }
});

MatchSchema.virtual('userIds').get(function (this: MatchDocument) {
  return this.teams.map((t) => t.userIds).flat();
});

MatchSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

MatchSchema.statics.mock = function (values: Partial<Match> = {}) {
  const defaults: Partial<Match> = {
    gameServerTemplateId: new mongoose.Types.ObjectId(),
    namespaceId: new mongoose.Types.ObjectId(),
    teams: [MatchTeamModel.mock(), MatchTeamModel.mock()],
  };

  return new this({ ...defaults, ...values });
};

export const MatchModel = mongoose.model<MatchDocument, MatchModelType>('MatchSchema', MatchSchema);

export { MatchSchema };

export default MatchModel;
