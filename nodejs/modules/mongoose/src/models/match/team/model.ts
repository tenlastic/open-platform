import * as mongoose from 'mongoose';

import {
  arrayLengthValidator,
  arrayNullUndefinedValidator,
  duplicateValidator,
} from '../../../validators';

export interface MatchTeam {
  index?: number;
  rating?: number;
  teamId?: mongoose.Types.ObjectId;
  userIds: mongoose.Types.ObjectId[];
}

export type MatchTeamDocument = mongoose.Document<mongoose.Types.ObjectId> & MatchTeam;

export interface MatchTeamModelType extends mongoose.Model<MatchTeamDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: MatchTeamModelType, values?: Partial<MatchTeam>): MatchTeamDocument;
}

const MatchTeamSchema = new mongoose.Schema<MatchTeamDocument, MatchTeamModelType>(
  {
    index: { type: Number },
    rating: { type: Number },
    teamId: { ref: 'QueueSchema', type: mongoose.Schema.Types.ObjectId },
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
  { _id: false },
);

MatchTeamSchema.statics.mock = function (values: Partial<MatchTeam> = {}) {
  const defaults: Partial<MatchTeam> = {
    teamId: new mongoose.Types.ObjectId(),
    userIds: [new mongoose.Types.ObjectId()],
  };

  return new this({ ...defaults, ...values });
};

export const MatchTeamModel = mongoose.model<MatchTeamDocument, MatchTeamModelType>(
  'MatchTeamSchema',
  MatchTeamSchema,
);

export { MatchTeamSchema };

export default MatchTeamModel;
