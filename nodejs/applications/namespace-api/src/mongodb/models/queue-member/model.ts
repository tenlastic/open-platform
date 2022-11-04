import {
  DuplicateKeyError,
  duplicateKeyErrorPlugin,
  namespaceValidator,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { GroupDocument } from '../group';
import { QueueDocument } from '../queue';
import { WebSocketDocument } from '../web-socket';

export class QueueMemberDuplicateKeyError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[];

  constructor(userIds: string[] | mongoose.Types.ObjectId[]) {
    super(`The following Users are already in this Queue: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberDuplicateKeyError';
    this.userIds = userIds;
  }
}

@index({ namespaceId: 1, queueId: 1, userIds: 1 }, { unique: true })
@index({ webSocketId: 1 })
@modelOptions({ schemaOptions: { collection: 'queue-members', minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@pre('save', async function (this: QueueMemberDocument) {
  await this.setUserIds();
  await this.checkPlayersPerTeam();
})
@pre('validate', async function (this: QueueMemberDocument) {
  if (!this.populated('webSocketDocument')) {
    await this.populate('webSocketDocument');
  }

  if (this.userId.toString() !== this.webSocketDocument?.userId.toString()) {
    const message = 'Web Socket does not belong to the same User.';
    this.invalidate('webSocketId', message, this.webSocketId);
  }
})
@post('findOneAndUpdate', function (err: any, doc: QueueMemberDocument, next) {
  if (err.code === 11000) {
    const uniqueError = new DuplicateKeyError(err.keyValue);

    const i = uniqueError.paths.indexOf('userIds');
    const userIds = uniqueError.values[i];
    const duplicateQueueMemberError = new QueueMemberDuplicateKeyError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
})
@post('save', function (err: any, doc: QueueMemberDocument, next) {
  if (err.name === 'MongoError' && err.code === 11000) {
    const uniqueError = new DuplicateKeyError(err.keyValue);

    const i = uniqueError.paths.indexOf('userIds');
    const userIds = uniqueError.values[i];
    const duplicateQueueMemberError = new QueueMemberDuplicateKeyError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
})
export class QueueMemberSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    ref: 'GroupSchema',
    type: mongoose.Schema.Types.ObjectId,
  })
  public groupId: mongoose.Types.ObjectId;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({
    ref: 'QueueSchema',
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    validate: namespaceValidator('queueDocument', 'queueId'),
  })
  public queueId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public userIds: mongoose.Types.ObjectId[];

  @prop({ ref: 'WebSocketSchema', required: true })
  public webSocketId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: 'GroupSchema' })
  public groupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'webSocketId', ref: 'WebSocketSchema' })
  public webSocketDocument: WebSocketDocument;

  /**
   * Get the number of Users matching the criteria.
   */
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
