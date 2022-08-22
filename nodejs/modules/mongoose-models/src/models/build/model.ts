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

import {
  changeStreamPlugin,
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
} from '../../change-stream';
import * as errors from '../../errors';
import { NamespaceDocument } from '../namespace';
import { WorkflowStatusSchema } from '../workflow';
import { BuildFileSchema } from './file';
import { BuildReferenceSchema } from './reference';

export const OnBuildProduced = new EventEmitter<IDatabasePayload<BuildDocument>>();

export enum BuildPlatform {
  Server64 = 'server64',
  Windows64 = 'windows64',
}

@index({ name: 1, namespaceId: 1, platform: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'builds', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnBuildProduced })
@plugin(errors.unique.plugin)
export class BuildSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public entrypoint: string;

  @prop({ type: BuildFileSchema })
  public files: BuildFileSchema[];

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: BuildPlatform, immutable: true, required: true })
  public platform: BuildPlatform;

  @prop({ default: null })
  public publishedAt: Date;

  @prop()
  public reference: BuildReferenceSchema;

  @prop()
  public status: WorkflowStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  public getFilePath(path: string) {
    return `namespaces/${this.namespaceId}/builds/${this._id}/${path}`;
  }

  public getZipPath() {
    return `namespaces/${this.namespaceId}/builds/${this._id}/archive.zip`;
  }
}

export type BuildDocument = DocumentType<BuildSchema>;
export type BuildModel = ReturnModelType<typeof BuildSchema>;
export const Build = getModelForClass(BuildSchema);
