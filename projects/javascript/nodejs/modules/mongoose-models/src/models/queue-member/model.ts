import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as mongooseUniqueError from '@tenlastic/mongoose-unique-error';
import { MongoError } from 'mongodb';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { GameAccess } from '../game';
import { GameAuthorization, GameAuthorizationStatus } from '../game-authorization';
import { GroupDocument, GroupEvent } from '../group';
import { NamespaceDocument } from '../namespace';
import { QueueDocument, QueueEvent } from '../queue';
import { UserDocument } from '../user';
import { WebSocketDocument, WebSocketEvent } from '../web-socket';

export class QueueMemberAuthorizationError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[] | Array<Ref<UserDocument>>;

  constructor(userIds: string[] | mongoose.Types.ObjectId[] | Array<Ref<UserDocument>>) {
    super(`The following Users are missing a Game Invitation: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberAuthorizationError';
    this.userIds = userIds;
  }
}
export class QueueMemberUniquenessError extends Error {
  public userIds: string[] | mongoose.Types.ObjectId[] | Array<Ref<UserDocument>>;

  constructor(userIds: string[] | mongoose.Types.ObjectId[] | Array<Ref<UserDocument>>) {
    super(`The following Users are already in this Queue: ${userIds.join(', ')}.`);

    this.name = 'QueueMemberUniquenessError';
    this.userIds = userIds;
  }
}
export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();

// Delete QueueMember when associated Group is deleted or updated.
GroupEvent.sync(async payload => {
  if (payload.operationType === 'insert') {
    return;
  }

  const queueMembers = await QueueMember.find({ groupId: payload.fullDocument._id });
  return Promise.all(queueMembers.map(qm => qm.remove()));
});

// Delete QueueMember when associated Queue is deleted.
QueueEvent.sync(async payload => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({ queueId: payload.fullDocument._id });
  return Promise.all(queueMembers.map(qm => qm.remove()));
});

// Delete QueueMember when associated WebSocket is deleted.
WebSocketEvent.sync(async payload => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({ webSocketId: payload.fullDocument._id });
  return Promise.all(queueMembers.map(qm => qm.remove()));
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
@plugin(mongooseUniqueError.plugin)
@pre('save', async function(this: QueueMemberDocument) {
  await this.setUserIds();
  await this.checkPlayersPerTeam();
  await this.checkUserAuthorization();
})
@pre('validate', async function(this: QueueMemberDocument) {
  if (!this.populated('webSocketDocument')) {
    await this.populate('webSocketDocument').execPopulate();
  }

  if (this.userId.toString() !== this.webSocketDocument.userId.toString()) {
    const message = 'Web Socket does not belong to the same User.';
    this.invalidate('webSocketId', message, this.webSocketId);
  }
})
@post('findOneAndUpdate', function(err: MongoError, doc: QueueMemberDocument, next) {
  if (err.name === 'MongoError' && err.code === 11000) {
    const update = this.getUpdate();
    const uniquenessError = mongooseUniqueError.getValidationError(
      err,
      doc.schema,
      update,
    ) as mongooseUniqueError.UniquenessError;

    const i = uniquenessError.paths.indexOf('userIds');
    const userIds = uniquenessError.values[i];
    const duplicateQueueMemberError = new QueueMemberUniquenessError(userIds);

    return next(duplicateQueueMemberError);
  }

  return next(err);
})
@post('save', function(err: MongoError, doc: QueueMemberDocument, next) {
  if (err.name === 'MongoError' && err.code === 11000) {
    const uniquenessError = mongooseUniqueError.getValidationError(
      err,
      doc.schema,
      doc,
    ) as mongooseUniqueError.UniquenessError;

    const i = uniquenessError.paths.indexOf('userIds');
    const userIds = uniquenessError.values[i];
    const duplicateQueueMemberError = new QueueMemberUniquenessError(userIds);

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
  public groupId: Ref<GroupDocument>;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({
    immutable: true,
    ref: 'QueueSchema',
    required: true,
    validate: namespaceValidator('queueDocument', 'queueId'),
  })
  public queueId: Ref<QueueDocument>;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @arrayProp({ itemsRef: 'UserSchema' })
  public userIds: Array<Ref<UserDocument>>;

  @prop({ ref: 'WebSocketSchema', required: true })
  public webSocketId: Ref<WebSocketDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: 'GroupSchema' })
  public groupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: false, localField: 'userIds', ref: 'UserSchema' })
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
      await this.populate('queueDocument').execPopulate();
    }

    if (this.userIds.length > this.queueDocument.usersPerTeam) {
      throw new Error('Group size is too large for this Queue.');
    }
  }

  private async checkUserAuthorization(this: QueueMemberDocument) {
    if (!this.populated('queueDocument')) {
      await this.populate('queueDocument').execPopulate();
    }

    if (!this.queueDocument.gameId) {
      return;
    }

    if (!this.queueDocument.populated('gameDocument')) {
      await this.queueDocument.populate('gameDocument').execPopulate();
    }

    const game = this.queueDocument.gameDocument;
    const gameAuthorizations = await GameAuthorization.find({
      gameId: game._id,
      userId: { $in: this.userIds },
    });

    const unauthorizedUserIds = this.userIds.filter(ui => {
      if (game.access === GameAccess.Public) {
        return gameAuthorizations
          .filter(ga => ga.status === GameAuthorizationStatus.Revoked)
          .some(ga => ga.userId.equals(ui));
      } else {
        return !gameAuthorizations
          .filter(ga => ga.status === GameAuthorizationStatus.Granted)
          .some(ga => ga.userId.equals(ui));
      }
    });

    if (unauthorizedUserIds.length > 0) {
      throw new QueueMemberAuthorizationError(unauthorizedUserIds);
    }
  }

  private async setUserIds(this: QueueMemberDocument) {
    if (this.groupId) {
      if (!this.populated('groupDocument')) {
        await this.populate('groupDocument').execPopulate();
      }

      this.userIds = this.groupDocument ? this.groupDocument.userIds : [];
    } else {
      this.userIds = [this.userId];
    }
  }
}

export type QueueMemberDocument = DocumentType<QueueMemberSchema>;
export type QueueMemberModel = ReturnModelType<typeof QueueMemberSchema>;
export const QueueMember = getModelForClass(QueueMemberSchema);
