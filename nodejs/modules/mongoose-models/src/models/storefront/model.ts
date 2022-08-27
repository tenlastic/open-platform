import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  Severity,
} from '@typegoose/typegoose';
import * as minio from '@tenlastic/minio';
import * as mongoose from 'mongoose';

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import * as errors from '../../errors';
import { NamespaceDocument } from '../namespace';
import { AuthorizationDocument } from '../authorization';

export const OnStorefrontProduced = new EventEmitter<IDatabasePayload<StorefrontDocument>>();

@index({ namespaceId: 1 }, { unique: true })
@index({ subtitle: 1, title: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'storefronts', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnStorefrontProduced })
@plugin(errors.unique.plugin)
export class StorefrontSchema {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public background: string;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop()
  public icon: string;

  @prop({ type: String })
  public images: string[];

  @prop()
  public logo: string;

  @prop()
  public metadata: any;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ match: /^.{2,40}$/ })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, required: true })
  public title: string;

  public updatedAt: Date;

  @prop({ type: String })
  public videos: string[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  /**
   * Get the path for the property within Minio.
   */
  public getMinioKey(field?: string, _id?: string) {
    const id = _id || new mongoose.Types.ObjectId();

    switch (field) {
      case 'background':
        return `namespaces/${this.namespaceId}/storefronts/${this._id}/background`;
      case 'icon':
        return `namespaces/${this.namespaceId}/storefronts/${this._id}/icon`;
      case 'images':
        return `namespaces/${this.namespaceId}/storefronts/${this._id}/images/${id}`;
      case 'videos':
        return `namespaces/${this.namespaceId}/storefronts/${this._id}/videos/${id}`;
      default:
        return `namespaces/${this.namespaceId}/storefronts/${this._id}`;
    }
  }

  /**
   * Get the URL for the property within Minio.
   */
  public getUrl(host: string, protocol: string, path: string) {
    const base = `${protocol}://${host}`;
    return `${base}/${path.replace(/namespaces\/[^\/]+\//, '')}`;
  }

  /**
   * Removes unusued images from Minio.
   */
  public async removeMinioImages(this: StorefrontDocument) {
    const prefix = this.getMinioKey() + '/images';
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    for (const object of objects) {
      const _id = object.name.replace(`${prefix}/`, '');
      const image = this.images.find((i) => i.includes(`images/${_id}`));

      if (!image) {
        await minio.removeObject(process.env.MINIO_BUCKET, object.name);
      }
    }
  }

  /**
   * Removes all objects from Minio.
   */
  public async removeMinioObjects(this: StorefrontDocument) {
    const prefix = this.getMinioKey();
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    const promises = objects.map((o) => minio.removeObject(process.env.MINIO_BUCKET, o.name));
    return Promise.all(promises);
  }

  /**
   * Removes unusued videos from Minio.
   */
  public async removeMinioVideos(this: StorefrontDocument) {
    const prefix = this.getMinioKey() + '/videos';
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    for (const object of objects) {
      const _id = object.name.replace(`${prefix}/`, '');
      const video = this.videos.find((i) => i.includes(`videos/${_id}`));

      if (!video) {
        await minio.removeObject(process.env.MINIO_BUCKET, object.name);
      }
    }
  }
}

export type StorefrontDocument = DocumentType<StorefrontSchema>;
export type StorefrontModel = ReturnModelType<typeof StorefrontSchema>;
export const Storefront = getModelForClass(StorefrontSchema);
