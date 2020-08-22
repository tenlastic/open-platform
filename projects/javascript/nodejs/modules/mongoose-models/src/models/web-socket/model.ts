import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
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

// Publish changes to Kafka.
const WebSocketEvent = new EventEmitter<IDatabasePayload<WebSocketDocument>>();
WebSocketEvent.on(payload => {
  kafka.publish(payload);
});

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

@index(
  {
    gameId: 1,
    userId: 1,
  },
  {
    partialFilterExpression: {
      gameId: { $exists: true },
    },
    unique: true,
  },
)
@index({ heartbeatAt: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'websockets',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: WebSocketEvent,
})
@plugin(uniqueErrorPlugin)
@post('remove', (doc: WebSocketDocument) => clearTimeout(doc.heartbeatTimeout))
@post('save', (doc: WebSocketDocument) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  clearTimeout(doc.heartbeatTimeout);
  doc.heartbeatTimeout = setTimeout(() => {
    doc.heartbeatAt = new Date();
    doc.save();
  }, HEARTBEAT * 0.75);
})
export class WebSocketSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public deleteAt: Date;

  @prop()
  public gameId: mongoose.Types.ObjectId;

  @prop({ default: Date.now })
  public heartbeatAt: Date;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  public heartbeatTimeout: NodeJS.Timeout;
}

export type WebSocketDocument = DocumentType<WebSocketSchema>;
export type WebSocketModel = ReturnModelType<typeof WebSocketSchema>;
export const WebSocket = getModelForClass(WebSocketSchema);
