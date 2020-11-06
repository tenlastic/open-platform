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
import { BuildDocument } from '../build';
import { BuildTaskFailure, BuildTaskFailureDocument } from './failure';

export const BuildTaskEvent = new EventEmitter<IDatabasePayload<BuildTaskDocument>>();
BuildTaskEvent.on(payload => {
  kafka.publish(payload);
});

export enum BuildTaskAction {
  Build = 'build',
  Copy = 'copy',
  Remove = 'remove',
  Unzip = 'unzip',
}

@index({ action: 1 })
@index({ buildId: 1 })
@index({ completedAt: 1 })
@index({ failedAt: 1 })
@index({ startedAt: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'buildtasks',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: BuildTaskEvent,
})
export class BuildTaskSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ enum: BuildTaskAction, required: true })
  public action: BuildTaskAction;

  @prop({ ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  @prop({ default: null })
  public completedAt: Date;

  public createdAt: Date;

  @prop({ default: null })
  public failedAt: Date;

  @arrayProp({ default: [], items: BuildTaskFailure })
  public failures: BuildTaskFailureDocument[];

  @prop({ default: {} })
  public metadata: any;

  @prop({ enum: FilePlatform, required: true })
  public platform: string;

  @prop({ default: null })
  public startedAt: Date;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  public async getMinioKey(this: BuildTaskDocument) {
    if (!this.populated('buildDocument')) {
      await this.populate('buildDocument').execPopulate();
    }

    const { namespaceId } = this.buildDocument;
    const { _id, buildId } = this;

    return `namespaces/${namespaceId}/builds/${buildId}/archives/${_id}.zip`;
  }
}

export type BuildTaskDocument = DocumentType<BuildTaskSchema>;
export type BuildTaskModel = ReturnModelType<typeof BuildTaskSchema>;
export const BuildTask = getModelForClass(BuildTaskSchema);
