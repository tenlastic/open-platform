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
} from '@typegoose/typegoose';
import * as minio from '@tenlastic/minio';
import {
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';
import * as requestPromiseNative from 'request-promise-native';

import { namespaceValidator } from '../../validators';
import { GameDocument, GameEvent } from '../game';
import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { WorkflowStatusSchema } from '../workflow';
import { BuildFileSchema } from './file';
import { BuildReferenceSchema } from './reference';

export const BuildEvent = new EventEmitter<IDatabasePayload<BuildDocument>>();

export enum BuildPlatform {
  Server64 = 'server64',
  Windows64 = 'windows64',
}

// Delete files from Minio if associated Build is deleted.
BuildEvent.sync(async (payload) => {
  if (payload.operationType !== 'delete') {
    return;
  }

  // Delete zip file.
  const build = payload.fullDocument;
  const zipPath = build.getZipPath();
  await minio.removeObject(process.env.MINIO_BUCKET, zipPath);

  // Delete build files.
  for (const file of build.files) {
    const path = build.getFilePath(file.path);
    await minio.removeObject(process.env.MINIO_BUCKET, path);
  }

  // Delete docker tag.
  const headers = { Accept: 'application/vnd.docker.distribution.manifest.v2+json' };
  const url = process.env.DOCKER_REGISTRY_URL;

  const response: requestPromiseNative.FullResponse = await requestPromiseNative({
    headers,
    method: 'GET',
    resolveWithFullResponse: true,
    url: `${url}/v2/${build.namespaceId}/manifests/${build._id}`,
  });

  const digest = response.headers['docker-content-digest'];
  await requestPromiseNative({
    headers,
    method: 'DELETE',
    resolveWithFullResponse: true,
    url: `${url}/v2/${build.namespaceId}/manifests/${digest}`,
  });
});

// Delete Builds if associated Game is deleted.
GameEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Build.find({ gameId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Builds if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Build.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index(
  { gameId: 1, name: 1, namespaceId: 1, platform: 1 },
  {
    partialFilterExpression: { gameId: { $type: 'objectId' } },
    unique: true,
  },
)
@index({ name: 1, namespaceId: 1, platform: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'builds', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: BuildEvent })
@plugin(uniqueErrorPlugin)
export class BuildSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public entrypoint: string;

  @arrayProp({ items: BuildFileSchema })
  public files: BuildFileSchema[];

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: Ref<GameDocument>;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ enum: BuildPlatform, immutable: true, required: true })
  public platform: BuildPlatform;

  @prop()
  public publishedAt: Date;

  @prop()
  public reference: BuildReferenceSchema;

  @prop()
  public status: WorkflowStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

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
