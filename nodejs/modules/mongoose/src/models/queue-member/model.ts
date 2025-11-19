import * as mongoose from 'mongoose';

import { DuplicateKeyError, duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { GroupDocument } from '../group';
import { MatchModel } from '../match';
import { QueueDocument } from '../queue';
import { TeamModel } from '../team';
import { QueueMemberTeamDocument, QueueMemberTeamModel, QueueMemberTeamSchema } from './team';

export class QueueMemberDuplicateKeyError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[];

  constructor(userIds: string[] | mongoose.Types.ObjectId[]) {
    super(`The following Users are already in this Queue: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberDuplicateKeyError';
    this.userIds = userIds;
  }
}

export class QueueMemberMatchError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[];

  constructor(userIds: string[] | mongoose.Types.ObjectId[]) {
    super(`The following Users are already in a Match: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberMatchError';
    this.userIds = userIds;
  }
}

export interface QueueMember {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  groupDocument?: GroupDocument;
  groupId?: mongoose.Types.ObjectId;
  matchedAt?: Date;
  namespaceId: mongoose.Types.ObjectId;
  queueDocument?: QueueDocument;
  queueId: mongoose.Types.ObjectId;
  team?: QueueMemberTeamDocument;
  unix?: number;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
  userIds: mongoose.Types.ObjectId[];
  webSocketId: mongoose.Types.ObjectId;
}

export type QueueMemberDocument = mongoose.Document<mongoose.Types.ObjectId> & QueueMember;

export interface QueueMemberModelType extends mongoose.Model<QueueMemberDocument> {
  /** Get the number of Users matching the criteria. */
  getUserIdCount(this: QueueMemberModelType, $match?: unknown): Promise<number>;

  /** Creates a record with randomized required parameters if not specified. */
  mock(this: QueueMemberModelType, values?: Partial<QueueMember>): QueueMemberDocument;
}

const QueueMemberSchema = new mongoose.Schema<QueueMemberDocument, QueueMemberModelType>(
  {
    groupId: { ref: 'GroupSchema', type: mongoose.Schema.Types.ObjectId },
    matchedAt: { type: Date },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    queueId: { ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    team: { type: QueueMemberTeamSchema },
    unix: { default: () => Date.now(), type: Number },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserSchema' }],
    webSocketId: { ref: 'WebSocketSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'queue-members', timestamps: true },
);

QueueMemberSchema.index({ namespaceId: 1, queueId: 1, userIds: 1 }, { unique: true });
QueueMemberSchema.index({ webSocketId: 1 });

QueueMemberSchema.plugin(duplicateKeyErrorPlugin);
QueueMemberSchema.plugin(unsetPlugin);

QueueMemberSchema.pre('save', async function (this: QueueMemberDocument) {
  await setUserIds(this);

  await checkGroupSize(this);
  await checkMatches(this);
  checkUsers(this);

  await setTeam(this);
});

QueueMemberSchema.post('save', function (err, doc: QueueMemberDocument, next) {
  if (err?.code === 11000 && err?.name === 'MongoError') {
    const uniqueError = new DuplicateKeyError(err.keyValue);

    const i = uniqueError.paths.indexOf('userIds');
    const userIds = uniqueError.values[i] as string[];
    const duplicateQueueMemberError = new QueueMemberDuplicateKeyError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
});

QueueMemberSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

QueueMemberSchema.virtual('groupDocument', {
  ref: 'GroupSchema',
  justOne: true,
  localField: 'groupId',
  foreignField: '_id',
});

QueueMemberSchema.virtual('queueDocument', {
  ref: 'QueueSchema',
  justOne: true,
  localField: 'queueId',
  foreignField: '_id',
});

QueueMemberSchema.statics.getUserIdCount = async function (
  this: QueueMemberModelType,
  $match?: unknown,
) {
  const results = await this.aggregate([
    { $match: $match ? this.find().cast(this, $match) : {} },
    { $unwind: '$userIds' },
    { $count: 'count' },
  ]);

  return results && results[0] ? results[0].count : 0;
};

QueueMemberSchema.statics.mock = function (values: Partial<QueueMember> = {}) {
  const defaults: Partial<QueueMember> = {
    namespaceId: new mongoose.Types.ObjectId(),
    queueId: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    webSocketId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const QueueMemberModel = mongoose.model<QueueMemberDocument, QueueMemberModelType>(
  'QueueMemberSchema',
  QueueMemberSchema,
);

export { QueueMemberSchema };

export default QueueMemberModel;

async function checkGroupSize(queueMember: QueueMemberDocument) {
  if (!queueMember.populated('queueDocument')) {
    await queueMember.populate('queueDocument');
  }

  if (!queueMember.queueDocument?.groupSizes?.includes(queueMember.userIds.length)) {
    throw new Error('Group size is not valid for this Queue.');
  }
}

async function checkMatches(queueMember: QueueMemberDocument) {
  const matches = await MatchModel.find({
    finishedAt: { $exists: false },
    'teams.userIds': { $in: queueMember.userIds },
  });
  if (matches.length === 0) {
    return;
  }

  const userIds = matches.map((m) => m.userIds).flat();
  const intersection = queueMember.userIds.filter((userId) =>
    userIds.some((ui) => ui.equals(userId)),
  );

  throw new QueueMemberMatchError(intersection);
}

async function checkUsers(queueMember: QueueMemberDocument) {
  if (!queueMember.userIds.some((ui) => ui.equals(queueMember.userId))) {
    throw new Error('User is not in the Group.');
  }
}

async function setTeam(queueMember: QueueMemberDocument) {
  if (!queueMember.populated('queueDocument')) {
    await queueMember.populate('queueDocument');
  }

  if (!queueMember.queueDocument?.teams) {
    return;
  }

  const team = await TeamModel.findOneAndUpdate(
    {
      namespaceId: queueMember.namespaceId,
      queueId: queueMember.queueId,
      userIds: { $all: queueMember.userIds, $size: queueMember.userIds.length },
    },
    {
      $setOnInsert: { rating: queueMember.queueDocument?.initialRating },
      namespaceId: queueMember.namespaceId,
      queueId: queueMember.queueId,
      userIds: queueMember.userIds,
    },
    { new: true, upsert: true },
  );

  queueMember.team = new QueueMemberTeamModel({ rating: team.rating, teamId: team._id });
}

async function setUserIds(queueMember: QueueMemberDocument) {
  if (queueMember.groupId) {
    if (!queueMember.populated('groupDocument')) {
      await queueMember.populate('groupDocument');
    }

    queueMember.userIds = queueMember.groupDocument?.userIds ?? [];
  } else {
    queueMember.userIds = [queueMember.userId];
  }
}
