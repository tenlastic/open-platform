import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  plugin,
  pre,
  prop,
  index,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { BuildDocument, BuildEvent } from '../build';
import { NamespaceDocument } from '../namespace';

export const FileEvent = new EventEmitter<IDatabasePayload<FileDocument>>();

export enum FilePlatform {
  Linux64 = 'linux64',
  Mac64 = 'mac64',
  Server64 = 'server64',
  Windows64 = 'windows64',
}

// Publish changes to Kafka.
FileEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Files on Build deletion.
BuildEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const files = await File.find({ buildId: payload.fullDocument._id });
      const promises = files.map(f => f.remove());
      return Promise.all(promises);
  }
});

// Delete Minio objects with Mongoose deletion.
FileEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const minioKey = await payload.fullDocument.getMinioKey();
      return minio.removeObject(process.env.MINIO_BUCKET, minioKey);
  }
});

@index({ buildId: 1, path: 1, platform: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'files',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: FileEvent })
@pre('findOneAndUpdate', async function(
  this: mongoose.DocumentQuery<FileDocument, FileDocument, {}>,
) {
  let update = this.getUpdate();
  if (update.$set || update.$setOnInsert) {
    update = { ...update, ...update.$set, ...update.$setOnInsert };
  }

  const doc = new File(update);
  await doc.populate('buildDocument').execPopulate();

  this.getUpdate().$setOnInsert.namespaceId = doc.buildDocument.namespaceId;
})
@pre('save', async function(this: FileDocument) {
  if (!this.populated('buildDocument')) {
    await this.populate('buildDocument').execPopulate();
  }

  this.namespaceId = this.buildDocument.namespaceId;
})
export class FileSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  @prop({ required: true })
  public compressedBytes: number;

  public createdAt: Date;

  @prop({ required: true })
  public md5: string;

  @prop({ automatic: true, immutable: true, ref: 'NamespaceSchema' })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ required: true })
  public path: string;

  @prop({ enum: FilePlatform, required: true })
  public platform: FilePlatform;

  @prop({ required: true })
  public uncompressedBytes: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public async getMinioKey(this: FileDocument) {
    const { buildId, path, platform } = this;

    let { namespaceId } = this;
    if (!namespaceId) {
      if (!this.populated('buildDocument')) {
        await this.populate('buildDocument').execPopulate();
      }

      namespaceId = this.buildDocument.namespaceId;
    }

    return `namespaces/${namespaceId}/builds/${buildId}/${platform}/${path}`;
  }
}

export type FileDocument = DocumentType<FileSchema>;
export type FileModel = ReturnModelType<typeof FileSchema>;
export const File = getModelForClass(FileSchema);
