import * as minio from '@tenlastic/minio';
import { duplicateKeyErrorPlugin } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import axios from 'axios';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { WorkflowStatusSchema } from '../workflow';
import { BuildFileSchema } from './file';
import { BuildReferenceSchema } from './reference';

export enum BuildPlatform {
  Server64 = 'Server64',
  Windows64 = 'Windows64',
}

@index({ name: 1, namespaceId: 1, platform: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'builds', minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
export class BuildSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: String })
  public entrypoint: string;

  @prop({ type: BuildFileSchema }, PropType.ARRAY)
  public files: BuildFileSchema[];

  @prop({ required: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: BuildPlatform, required: true, type: String })
  public platform: BuildPlatform;

  @prop({ type: Date })
  public publishedAt: Date;

  @prop({ type: BuildReferenceSchema })
  public reference: BuildReferenceSchema;

  @prop({ merge: true, type: WorkflowStatusSchema })
  public status: WorkflowStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

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
