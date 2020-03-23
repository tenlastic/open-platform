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
import { ReleaseTaskFailure, ReleaseTaskFailureDocument } from './failure';

export const ReleaseTaskEvent = new EventEmitter<IDatabasePayload<ReleaseTaskDocument>>();
ReleaseTaskEvent.on(kafka.publish);

export enum ReleaseTaskAction {
  Build = 'build',
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
    collection: 'releasetasks',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ReleaseTaskEvent,
})
export class ReleaseTaskSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ enum: ReleaseTaskAction, required: true })
  public action: ReleaseTaskAction;

  @prop({ default: null })
  public completedAt: Date;

  public createdAt: Date;

  @arrayProp({ default: [], items: ReleaseTaskFailure })
  public failures: ReleaseTaskFailureDocument[];

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

export type ReleaseTaskDocument = DocumentType<ReleaseTaskSchema>;
export type ReleaseTaskModel = ReturnModelType<typeof ReleaseTaskSchema>;
export const ReleaseTask = getModelForClass(ReleaseTaskSchema);
