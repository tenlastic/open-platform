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

import { FilePlatform } from '../file';
import { Release, ReleaseDocument } from '../release';
import { ReleaseJobFailure, ReleaseJobFailureDocument } from './failure';

export const ReleaseJobEvent = new EventEmitter<IDatabasePayload<ReleaseJobDocument>>();
ReleaseJobEvent.on(kafka.publish);

export enum ReleaseJobAction {
  Copy = 'copy',
  Remove = 'remove',
  Unzip = 'unzip',
}

@index({ action: 1 })
@index({ completedAt: 1 })
@index({ releaseId: 1 })
@index({ startedAt: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'releasejobs',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ReleaseJobEvent,
})
export class ReleaseJobSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ enum: ReleaseJobAction, required: true })
  public action: ReleaseJobAction;

  @prop({ default: null })
  public completedAt: Date;

  public createdAt: Date;

  @arrayProp({ default: [], items: ReleaseJobFailure })
  public failures: ReleaseJobFailureDocument[];

  @prop({ default: {} })
  public metadata: any;

  @prop({ enum: FilePlatform, required: true })
  public platform: FilePlatform;

  @prop({ ref: Release, required: true })
  public releaseId: Ref<ReleaseDocument>;

  @prop({ default: null })
  public startedAt: Date;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'releaseId', ref: Release })
  public releaseDocument: ReleaseDocument;

  public get minioZipObjectName() {
    return `${this.releaseId}/${this.platform}/${this._id}.zip`;
  }
}

export type ReleaseJobDocument = DocumentType<ReleaseJobSchema>;
export type ReleaseJobModel = ReturnModelType<typeof ReleaseJobSchema>;
export const ReleaseJob = getModelForClass(ReleaseJobSchema);
