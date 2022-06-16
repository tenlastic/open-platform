import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { UserDocument } from '../user/model';

export const WebSocketEvent = new EventEmitter<IDatabasePayload<WebSocketDocument>>();

@index({ nodeId: 1 })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'websockets',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WebSocketEvent })
@plugin(errors.unique.plugin)
export class WebSocketSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public disconnectedAt: Date;

  @prop({ required: true })
  public nodeId: string;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type WebSocketDocument = DocumentType<WebSocketSchema>;
export type WebSocketModel = ReturnModelType<typeof WebSocketSchema>;
export const WebSocket = getModelForClass(WebSocketSchema);
