import {
  DocumentType,
  Ref,
  ReturnModelType,
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
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { UserDocument } from '../user/model';

const ConnectionEvent = new EventEmitter<IDatabasePayload<ConnectionDocument>>();
ConnectionEvent.on(kafka.publish);

@index(
  {
    gameId: 1,
    userId: 1,
  },
  {
    partialFilterExpression: {
      $or: [{ disconnectedAt: { $exists: false } }, { disconnectedAt: null }],
      gameId: { $exists: true },
    },
    unique: true,
  },
)
@index({ disconnectedAt: 1 })
@index({ disconnectedAt: -1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'connections',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ConnectionEvent,
})
@plugin(uniqueErrorPlugin)
export class ConnectionSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public disconnectedAt: Date;

  @prop()
  public gameId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type ConnectionDocument = DocumentType<ConnectionSchema>;
export type ConnectionModel = ReturnModelType<typeof ConnectionSchema>;
export const Connection = getModelForClass(ConnectionSchema);
