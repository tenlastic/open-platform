import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

@index({ disconnectedAt: 1 })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ namespaceId: 1 })
@index({ nodeId: 1 })
@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'web-sockets', timestamps: true } })
@plugin(unsetPlugin)
export class WebSocketSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: Date })
  public disconnectedAt: Date;

  @prop({ type: Date })
  public expiresAt: Date;

  @prop({ ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ maxlength: 256, trim: true, required: true, type: String })
  public nodeId: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Updates the disconnectedAt timestamp in MongoDB.
   */
  public static disconnect(this: typeof WebSocketModel, _id: mongoose.Types.ObjectId) {
    const disconnectedAt = new Date();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.updateOne(
      { _id, disconnectedAt: { $exists: false } },
      { disconnectedAt, expiresAt },
    );
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof WebSocketModel, values: Partial<WebSocketSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      nodeId: chance.hash(),
      userId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type WebSocketDocument = DocumentType<WebSocketSchema>;
export const WebSocketModel = getModelForClass(WebSocketSchema);
