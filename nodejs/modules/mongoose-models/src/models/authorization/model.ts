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
import { namespaceValidator } from '../../validators';
import { GameDocument, GameEvent } from '../game';
import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { UserDocument } from '../user';

export const AuthorizationEvent = new EventEmitter<IDatabasePayload<AuthorizationDocument>>();

export enum AuthorizationStatus {
  Granted = 'granted',
  Pending = 'pending',
  Revoked = 'revoked',
}

// Delete Authorizations if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Authorization.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1, userId: 1 }, { unique: true })
@index({ status: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'authorizations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: AuthorizationEvent })
@plugin(errors.unique.plugin)
export class AuthorizationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ default: AuthorizationStatus.Pending, enum: AuthorizationStatus })
  public status: AuthorizationStatus;

  @prop({ ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type AuthorizationDocument = DocumentType<AuthorizationSchema>;
export type AuthorizationModel = ReturnModelType<typeof AuthorizationSchema>;
export const Authorization = getModelForClass(AuthorizationSchema);
