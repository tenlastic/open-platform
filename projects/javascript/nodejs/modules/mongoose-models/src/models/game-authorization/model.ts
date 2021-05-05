import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { GameDocument, GameEvent } from '../game';
import { NamespaceDocument } from '../namespace';
import { UserDocument } from '../user';

export const GameAuthorizationEvent = new EventEmitter<
  IDatabasePayload<GameAuthorizationDocument>
>();

export enum GameAuthorizationStatus {
  Granted = 'granted',
  Pending = 'pending',
  Revoked = 'revoked',
}

// Delete GameAuthorizations if associated Game is deleted.
GameEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameAuthorization.find({ gameId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1, userId: 1 }, { unique: true })
@index({ namespaceId: 1 })
@index({ status: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'gameauthorizations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameAuthorizationEvent })
@plugin(uniqueErrorPlugin)
export class GameAuthorizationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    ref: 'GameSchema',
    required: true,
    validate: namespaceValidator('gameDocument', 'gameId'),
  })
  public gameId: Ref<GameDocument>;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ default: GameAuthorizationStatus.Pending, enum: GameAuthorizationStatus })
  public status: GameAuthorizationStatus;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type GameAuthorizationDocument = DocumentType<GameAuthorizationSchema>;
export type GameAuthorizationModel = ReturnModelType<typeof GameAuthorizationSchema>;
export const GameAuthorization = getModelForClass(GameAuthorizationSchema);
