import * as mongoose from 'mongoose';

export interface QueueMemberTeam {
  rating?: number;
  teamId: mongoose.Types.ObjectId;
}

export type QueueMemberTeamDocument = mongoose.Document<mongoose.Types.ObjectId> & QueueMemberTeam;

export interface QueueMemberTeamModelType extends mongoose.Model<QueueMemberTeamDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: QueueMemberTeamModelType, values?: Partial<QueueMemberTeam>): QueueMemberTeamDocument;
}

const QueueMemberTeamSchema = new mongoose.Schema<
  QueueMemberTeamDocument,
  QueueMemberTeamModelType
>(
  {
    rating: { type: Number },
    teamId: { ref: 'TeamSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { _id: false },
);

QueueMemberTeamSchema.statics.mock = function (values: Partial<QueueMemberTeam> = {}) {
  const defaults: Partial<QueueMemberTeam> = { teamId: new mongoose.Types.ObjectId() };

  return new this({ ...defaults, ...values });
};

export const QueueMemberTeamModel = mongoose.model<
  QueueMemberTeamDocument,
  QueueMemberTeamModelType
>('QueueMemberTeamSchema', QueueMemberTeamSchema);

export { QueueMemberTeamSchema };

export default QueueMemberTeamModel;
