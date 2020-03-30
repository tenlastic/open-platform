import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { ReadonlyGame, ReadonlyGameDocument } from '../readonly-game';
import { ReadonlyUser, ReadonlyUserDocument } from '../readonly-user';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
GameServerEvent.on(kafka.publish);

@index({ gameId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'gameservers',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameServerEvent,
})
export class GameServerSchema {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ itemsRef: ReadonlyUser })
  public allowedUserIds: Array<Ref<ReadonlyUserDocument>>;

  public createdAt: Date;

  @arrayProp({ itemsRef: ReadonlyUser })
  public currentUserIds: Array<Ref<ReadonlyUserDocument>>;

  @prop()
  public description: string;

  @prop({ ref: ReadonlyGame, required: true })
  public gameId: Ref<ReadonlyGameDocument>;

  @prop()
  public maxUsers: number;

  @prop()
  public metadata: any;

  @prop()
  public name: string;

  @prop()
  public password: string;

  public updatedAt: Date;

  @prop()
  public url: string;

  @prop({ foreignField: '_id', justOne: false, localField: 'allowedUserIds', ref: ReadonlyUser })
  public allowedUserDocuments: ReadonlyUserDocument[];

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: ReadonlyUser })
  public currentUserDocuments: ReadonlyUserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: ReadonlyGame })
  public gameDocument: ReadonlyGameDocument[];
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);
