import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { namespaceValidator } from '../../validators';
import { GroupDocument, GroupEvent } from '../group';
import { NamespaceDocument } from '../namespace';
import { QueueDocument, QueueEvent } from '../queue';
import { UserDocument } from '../user';
import { WebSocketDocument, WebSocketEvent } from '../web-socket';

export class QueueMemberAuthorizationError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[];

  constructor(userIds: string[] | mongoose.Types.ObjectId[]) {
    super(`The following Users are missing a Game Invitation: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberAuthorizationError';
    this.userIds = userIds;
  }
}
export class QueueMemberUniqueError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[];

  constructor(userIds: string[] | mongoose.Types.ObjectId[]) {
    super(`The following Users are already in this Queue: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberUniqueError';
    this.userIds = userIds;
  }
}
export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
GroupEvent.sync(async (payload) => {
  if (payload.operationType === 'insert') {
    return;
  }

  const queueMembers = await QueueMember.find({ groupId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated Queue is deleted.
QueueEvent.sync(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({ queueId: payload.fullDocument._id });
  return Promise.all(queueMembers.map((qm) => qm.remove()));
});

// Delete QueueMember when associated WebSocket is deleted or disconnected.
WebSocketEvent.sync(async (payload) => {
  if (
    payload.operationType === 'delete' ||
    payload.updateDescription?.updatedFields?.disconnectedAt
  ) {
    const queueMembers = await QueueMember.find({ webSocketId: payload.fullDocument._id });
    return Promise.all(queueMembers.map((qm) => qm.remove()));
  }
});

@index({ namespaceId: 1, queueId: 1, userIds: 1 }, { unique: true })
@index({ webSocketId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'queuemembers',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: QueueMemberEvent })
@plugin(errors.unique.plugin)
@pre('save', async function (this: QueueMemberDocument) {
  await this.setUserIds();
  await this.checkPlayersPerTeam();
})
@pre('validate', async function (this: QueueMemberDocument) {
  if (!this.populated('webSocketDocument')) {
    await this.populate('webSocketDocument');
  }

  if (this.userId.toString() !== this.webSocketDocument.userId.toString()) {
    const message = 'Web Socket does not belong to the same User.';
    this.invalidate('webSocketId', message, this.webSocketId);
  }
})
@post('findOneAndUpdate', function (err: any, doc: QueueMemberDocument, next) {
  if (err.code === 11000) {
    const uniqueError = new errors.unique.UniqueError(err.keyValue);

    const i = uniqueError.paths.indexOf('userIds');
    const userIds = uniqueError.values[i];
    const duplicateQueueMemberError = new QueueMemberUniqueError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
})
@post('save', function (err: any, doc: QueueMemberDocument, next) {
  if (err.name === 'MongoError' && err.code === 11000) {
    const uniqueError = new errors.unique.UniqueError(err.keyValue);

    const i = uniqueError.paths.indexOf('userIds');
    const userIds = uniqueError.values[i];
    const duplicateQueueMemberError = new QueueMemberUniqueError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
})
export class QueueMemberSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    immutable: true,
    ref: 'GroupSchema',
  })
  public groupId: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({
    immutable: true,
    ref: 'QueueSchema',
    required: true,
    validate: namespaceValidator('queueDocument', 'queueId'),
  })
  public queueId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: new mongoose.Types.ObjectId() })
  public userIds: mongoose.Types.ObjectId[];

  @prop({ ref: 'WebSocketSchema', required: true })
  public webSocketId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: 'GroupSchema' })
  public groupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  @prop({ foreignField: '_id', localField: 'userIds', ref: 'UserSchema' })
  public userDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'webSocketId', ref: 'WebSocketSchema' })
  public webSocketDocument: WebSocketDocument;

  public static async getUserIdCount($match: any = {}) {
    const results = await QueueMember.aggregate([
      { $match: QueueMember.find().cast(QueueMember, $match) },
      { $unwind: '$userIds' },
      { $count: 'count' },
    ]);

    return results && results[0] ? results[0].count : 0;
  }

  private async checkPlayersPerTeam(this: QueueMemberDocument) {
    if (!this.populated('queueDocument')) {
      await this.populate('queueDocument');
    }

    if (this.userIds.length > this.queueDocument.usersPerTeam) {
      throw new Error('Group size is too large for this Queue.');
    }
  }

  private async setUserIds(this: QueueMemberDocument) {
    if (this.groupId) {
      if (!this.populated('groupDocument')) {
        await this.populate('groupDocument');
      }

      this.userIds = this.groupDocument ? this.groupDocument.userIds : [];
    } else {
      this.userIds = [this.userId];
    }
  }
}

export type QueueMemberDocument = mongoose.Document & DocumentType<QueueMemberSchema>;
export type QueueMemberModel = ReturnModelType<typeof QueueMemberSchema>;
export const QueueMember = getModelForClass(QueueMemberSchema);
