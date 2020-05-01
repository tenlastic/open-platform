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

import { MINIO_BUCKET } from '../../constants';
import { Release, ReleaseDocument, ReleaseEvent } from '../release';

export const FileEvent = new EventEmitter<IDatabasePayload<FileDocument>>();
FileEvent.on(kafka.publish);
FileEvent.on(async event => {
  switch (event.operationType) {
    case 'delete':
      return minio.getClient().removeObject(MINIO_BUCKET, event.fullDocument.key);
  }
});
ReleaseEvent.on(async event => {
  switch (event.operationType) {
    case 'delete':
      const files = await File.find({ releaseId: event.fullDocument._id });
      const promises = files.map(f => f.remove());
      return Promise.all(promises);
  }
});

export enum FilePlatform {
  Linux64 = 'linux64',
  Mac64 = 'mac64',
  Server64 = 'server64',
  Windows64 = 'windows64',
}

@index({ path: 1, platform: 1, releaseId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'files',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: FileEvent,
})
export class FileSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public compressedBytes: number;

  public createdAt: Date;

  @prop({ required: true })
  public md5: string;

  @prop({ required: true })
  public path: string;

  @prop({ enum: FilePlatform, required: true })
  public platform: FilePlatform;

  @prop({ ref: Release, required: true })
  public releaseId: Ref<ReleaseDocument>;

  @prop({ required: true })
  public uncompressedBytes: number;

  public updatedAt: Date;

  public get key() {
    return `releases/${this.releaseId}/${this.platform}/${this.path}`;
  }

  @prop({ foreignField: '_id', justOne: true, localField: 'releaseId', ref: Release })
  public releaseDocument: ReleaseDocument;
}

export type FileDocument = DocumentType<FileSchema>;
export type FileModel = ReturnModelType<typeof FileSchema>;
export const File = getModelForClass(FileSchema);
