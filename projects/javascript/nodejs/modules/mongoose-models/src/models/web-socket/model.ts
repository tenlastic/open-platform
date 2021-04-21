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

import { RefreshTokenDocument } from '../refresh-token/model';
import { UserDocument } from '../user/model';

export const WebSocketEvent = new EventEmitter<IDatabasePayload<WebSocketDocument>>();

// Delete stale WebSockets.
const HEARTBEAT = 15000;
setInterval(async () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() - HEARTBEAT / 1000);

  const webSockets = await WebSocket.find({ heartbeatAt: { $lt: date } });
  for (const webSocket of webSockets) {
    await webSocket.remove();
  }
}, HEARTBEAT);

@index({ heartbeatAt: 1 })
@index({ refreshTokenId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'websockets',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WebSocketEvent })
@plugin(uniqueErrorPlugin)
export class WebSocketSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: Date.now })
  public heartbeatAt: Date;

  @prop({ immutable: true, ref: 'RefreshTokenSchema', required: true })
  public refreshTokenId: Ref<RefreshTokenDocument>;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type WebSocketDocument = DocumentType<WebSocketSchema>;
export type WebSocketModel = ReturnModelType<typeof WebSocketSchema>;
export const WebSocket = getModelForClass(WebSocketSchema);
