import { duplicateKeyErrorPlugin } from '@tenlastic/mongoose-models';
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

import { UserDocument } from '../user/model';

@index({ nodeId: 1 })
@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'web-sockets', minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
export class WebSocketSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: Date })
  public disconnectedAt: Date;

  @prop({ required: true, type: String })
  public nodeId: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  /**
   * Disconnects Web Sockets by Node ID.
   */
  public static async disconnectByNodeId(this: WebSocketModel, nodeId: string) {
    const webSockets = await this.find({ disconnectedAt: { $exists: false }, nodeId });

    const promises = webSockets.map(async (ws) => {
      ws.disconnectedAt = new Date();
      return ws.save();
    });

    return Promise.all(promises);
  }
}

export type WebSocketDocument = DocumentType<WebSocketSchema>;
export type WebSocketModel = ReturnModelType<typeof WebSocketSchema>;
export const WebSocket = getModelForClass(WebSocketSchema);
