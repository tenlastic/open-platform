import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  plugin,
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

@index({ path: 1, platform: 1, buildId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'files',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: FileEvent })
export class FileSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  @prop({ required: true })
  public compressedBytes: number;

  public createdAt: Date;

  @prop({ required: true })
  public md5: string;

  @prop({ required: true })
  public path: string;

  @prop({ enum: FilePlatform, required: true })
  public platform: FilePlatform;

  @prop({ required: true })
  public uncompressedBytes: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  public async getMinioKey(this: FileDocument) {
    if (!this.populated('buildDocument')) {
      await this.populate('buildDocument').execPopulate();
    }

    const { namespaceId } = this.buildDocument;
    const { path, platform, buildId } = this;

    return `namespaces/${namespaceId}/builds/${buildId}/${platform}/${path}`;
  }
}

export type FileDocument = DocumentType<FileSchema>;
export type FileModel = ReturnModelType<typeof FileSchema>;
export const File = getModelForClass(FileSchema);
