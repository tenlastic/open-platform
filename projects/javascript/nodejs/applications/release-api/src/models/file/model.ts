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
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Release, ReleaseDocument } from '../release';

export const FileEvent = new EventEmitter<IDatabasePayload<FileDocument>>();
FileEvent.on(kafka.publish);

export enum FilePlatform {
  Windows64 = 'windows64',
  Windows32 = 'windows32',
  Mac64 = 'mac64',
  Mac32 = 'mac32',
  Linux64 = 'linux64',
  Linux32 = 'linux32',
}

@index({ platform: 1, releaseId: 1, url: 1 }, { unique: true })
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
  public createdAt: Date;

  @prop()
  public md5: string;

  @prop({ required: true })
  public path: string;

  @prop({ enum: FilePlatform, required: true })
  public platform: FilePlatform;

  @prop({ ref: Release, required: true })
  public releaseId: Ref<ReleaseDocument>;

  @prop({ required: true })
  public url: string;

  public updatedAt: Date;

  public static get bucket() {
    return 'releases';
  }

  public get key() {
    return `${this.releaseId}/${this.platform}/${this.path}`;
  }

  @prop({ foreignField: '_id', justOne: true, localField: 'releaseId', ref: Release })
  public releaseDocument: ReleaseDocument;
}

export type FileDocument = DocumentType<FileSchema>;
export type FileModel = ReturnModelType<typeof FileSchema>;
export const File = getModelForClass(FileSchema);
