import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { BuildDocument } from '../build';
import { BuildTaskFailureSchema } from './failure';
import { FilePlatform } from '../file';
import { NamespaceDocument } from '../namespace';

export const BuildTaskEvent = new EventEmitter<IDatabasePayload<BuildTaskDocument>>();

export enum BuildTaskAction {
  Build = 'build',
  Copy = 'copy',
  Remove = 'remove',
  Unzip = 'unzip',
}

// Publish changes to Kafka.
BuildTaskEvent.on(payload => {
  kafka.publish(payload);
});

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
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: BuildTaskEvent })
@pre('findOneAndUpdate', async function(
  this: mongoose.DocumentQuery<BuildTaskDocument, BuildTaskDocument, {}>,
) {
  let update = this.getUpdate();
  if (update.$set || update.$setOnInsert) {
    update = { ...update, ...update.$set, ...update.$setOnInsert };
  }

  const doc = new BuildTask(update);
  await doc.populate('buildDocument').execPopulate();

  this.getUpdate().$setOnInsert.namespaceId = doc.buildDocument.namespaceId;
})
@pre('validate', async function(this: BuildTaskDocument) {
  if (!this.populated('buildDocument')) {
    await this.populate('buildDocument').execPopulate();
  }

  this.namespaceId = this.buildDocument.namespaceId;
})
export class BuildTaskSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ enum: BuildTaskAction, required: true })
  public action: BuildTaskAction;

  @prop({ immutable: true, ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  @prop({ default: null })
  public completedAt: Date;

  public createdAt: Date;

  @prop({ default: null })
  public failedAt: Date;

  @arrayProp({ items: BuildTaskFailureSchema })
  public failures: BuildTaskFailureSchema[];

  @prop({ default: {} })
  public metadata: any;

  @prop({ automatic: true, immutable: true, ref: 'NamespaceSchema' })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ enum: FilePlatform, required: true })
  public platform: string;

  @prop({ default: null })
  public startedAt: Date;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public async getMinioKey(this: BuildTaskDocument) {
    const { _id, buildId } = this;

    let { namespaceId } = this;
    if (!namespaceId) {
      if (!this.populated('buildDocument')) {
        await this.populate('buildDocument').execPopulate();
      }

      namespaceId = this.buildDocument.namespaceId;
    }

    return `namespaces/${namespaceId}/builds/${buildId}/archives/${_id}.zip`;
  }
}

export type BuildTaskDocument = DocumentType<BuildTaskSchema>;
export type BuildTaskModel = ReturnModelType<typeof BuildTaskSchema>;
export const BuildTask = getModelForClass(BuildTaskSchema);
