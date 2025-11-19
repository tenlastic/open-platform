import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import {
  arrayLengthValidator,
  arrayNullUndefinedValidator,
  duplicateValidator,
} from '../../validators';
import { AuthorizationDocument } from '../authorization';

export interface Team {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  metadata?: unknown;
  namespaceId: mongoose.Types.ObjectId;
  queueId: mongoose.Types.ObjectId;
  rating: number;
  updatedAt?: Date;
  userIds: mongoose.Types.ObjectId[];
}

export type TeamDocument = mongoose.Document<mongoose.Types.ObjectId> & Team;

export interface TeamModelType extends mongoose.Model<TeamDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: TeamModelType, values?: Partial<Team>): TeamDocument;
}

const TeamSchema = new mongoose.Schema<TeamDocument, TeamModelType>(
  {
    metadata: { type: mongoose.Schema.Types.Mixed, unset: false },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    queueId: { ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    rating: { required: true, type: Number },
    userIds: {
      required: true,
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserSchema' }],
      validate: [
        arrayLengthValidator(Infinity, 1),
        arrayNullUndefinedValidator,
        duplicateValidator,
      ],
    },
  },
  { collection: 'teams', timestamps: true },
);

TeamSchema.index({ userIds: 1 });

TeamSchema.plugin(unsetPlugin);

TeamSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

TeamSchema.statics.mock = function (values: Partial<Team> = {}) {
  const defaults: Partial<Team> = {
    namespaceId: new mongoose.Types.ObjectId(),
    queueId: new mongoose.Types.ObjectId(),
    userIds: [new mongoose.Types.ObjectId()],
  };

  return new this({ ...defaults, ...values });
};

export const TeamModel = mongoose.model<TeamDocument, TeamModelType>('TeamSchema', TeamSchema);

export { TeamSchema };

export default TeamModel;
