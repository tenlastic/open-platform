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
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { DuplicateKeyError, duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { GroupDocument } from '../group';
import { MatchModel } from '../match';
import { QueueDocument } from '../queue';

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

@index({ namespaceId: 1, queueId: 1, userIds: 1 }, { unique: true })
@index({ webSocketId: 1 })
@modelOptions({ schemaOptions: { collection: 'queue-members', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('save', async function (this: QueueMemberDocument) {
  await this.setUserIds();
  await this.checkMatches();
  await this.checkPlayersPerTeam();
  this.checkUsers();
})
@post('save', function (err: any, doc: QueueMemberDocument, next) {
  if (err.code === 11000 && err.name === 'MongoError') {
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

  @prop({ ref: 'GroupSchema', type: mongoose.Schema.Types.ObjectId })
  public groupId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public matchedAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ ref: 'QueueSchema', required: true, type: mongoose.Schema.Types.ObjectId })
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

  /**
   * Get the number of Users matching the criteria.
   */
  public static async getUserIdCount(this: typeof QueueMemberModel, $match: any = {}) {
    const results = await this.aggregate([
      { $match: this.find().cast(this, $match) },
      { $unwind: '$userIds' },
      { $count: 'count' },
    ]);

    return results && results[0] ? results[0].count : 0;
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof QueueMemberModel, values: Partial<QueueMemberSchema> = {}) {
    const defaults: Partial<QueueMemberDocument> = {
      namespaceId: new mongoose.Types.ObjectId(),
      queueId: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      webSocketId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }

  /**
   * Throws an error if a User is already in a Match.
   */
  private async checkMatches(this: QueueMemberDocument) {
    const matches = await MatchModel.find({ 'teams.userIds': { $in: this.userIds } });

    if (matches.length === 0) {
      return;
    }

    const userIds = matches.map((m) => m.userIds).flat();
    const intersection = this.userIds.filter((ui) => userIds.includes(ui));

    throw new QueueMemberMatchError(intersection);
  }

  /**
   * Throws an error if there are too many Users for the Queue.
   */
  private async checkPlayersPerTeam(this: QueueMemberDocument) {
    if (!this.populated('queueDocument')) {
      await this.populate('queueDocument');
    }

    if (this.userIds.length > this.queueDocument.usersPerTeam.reduce((a, b) => a + b, 0)) {
      throw new Error('Group size is too large for this Queue.');
    }
  }

  /**
   * Throws an error if the User is not in the User IDs.
   */
  private checkUsers(this: QueueMemberDocument) {
    if (!this.userIds.some((ui) => ui.equals(this.userId))) {
      throw new Error('User is not in the Group.');
    }
  }

  /**
   * Sets the User IDs.
   */
  private async setUserIds(this: QueueMemberDocument) {
    if (this.groupId) {
      if (!this.populated('groupDocument')) {
        await this.populate('groupDocument');
      }

      this.userIds = this.groupDocument?.userIds ?? [];
    } else {
      this.userIds = [this.userId];
    }
  }
}

export type QueueMemberDocument = mongoose.Document & DocumentType<QueueMemberSchema>;
export const QueueMemberModel = getModelForClass(QueueMemberSchema, { existingMongoose: mongoose });
