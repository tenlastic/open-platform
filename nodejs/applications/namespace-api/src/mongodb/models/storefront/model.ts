import {
  changeStreamPlugin,
  errors,
  EventEmitter,
  IDatabasePayload,
} from '@tenlastic/mongoose-models';
import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as minio from '@tenlastic/minio';
import * as mongoose from 'mongoose';

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

  @prop({ type: String })
  public background: string;

  public createdAt: Date;

  @prop({ type: String })
  public description: string;

  @prop({ type: String })
  public icon: string;

  @prop({ type: String }, PropType.ARRAY)
  public images: string[];

  @prop({ type: String })
  public logo: string;

  @prop({ type: mongoose.Schema.Types.Mixed })
  public metadata: any;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ match: /^.{2,40}$/, type: String })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, required: true, type: String })
  public title: string;

  public updatedAt: Date;

  @prop({ type: String }, PropType.ARRAY)
  public videos: string[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Get the path for the property within Minio.
   */
  public static getMinioKey(
    namespaceId: string,
    storefrontId: string,
    field: string,
    _id?: string,
  ) {
    const id = _id || new mongoose.Types.ObjectId();

    switch (field) {
      case 'background':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/background`;
      case 'icon':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/icon`;
      case 'images':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/images/${id}`;
      case 'videos':
        return `namespaces/${namespaceId}/storefronts/${storefrontId}/videos/${id}`;
      default:
        return `namespaces/${namespaceId}/storefronts/${storefrontId}`;
    }
  }

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
    return `${base}/${path}`;
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
