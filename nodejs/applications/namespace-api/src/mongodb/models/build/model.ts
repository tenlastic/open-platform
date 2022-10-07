import * as minio from '@tenlastic/minio';
import {
  changeStreamPlugin,
  errors,
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import axios from 'axios';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
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

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  public getFilePath(path: string) {
    return `namespaces/${this.namespaceId}/builds/${this._id}/${path}`;
  }

  public getZipPath() {
    return `namespaces/${this.namespaceId}/builds/${this._id}/archive.zip`;
  }

  public async deleteMinioFiles(this: BuildDocument) {
    // Delete zip file.
    const zipPath = this.getZipPath();
    await minio.removeObject(process.env.MINIO_BUCKET, zipPath);

    // Delete build files.
    for (const file of this.files) {
      const path = this.getFilePath(file.path);
      await minio.removeObject(process.env.MINIO_BUCKET, path);
    }

    // Delete docker tag.
    const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' };
    const url = process.env.DOCKER_REGISTRY_URL;

    const response = await axios({
      headers,
      method: 'GET',
      url: `${url}/v2/${this.namespaceId}/manifests/${this._id}`,
    });

    const digest = response.headers['docker-content-digest'];
    await axios({
      headers,
      method: 'DELETE',
      url: `${url}/v2/${this.namespaceId}/manifests/${digest}`,
    });
  }
}

export type BuildDocument = DocumentType<BuildSchema>;
export type BuildModel = ReturnModelType<typeof BuildSchema>;
export const Build = getModelForClass(BuildSchema);
