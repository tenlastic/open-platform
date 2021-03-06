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
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';

export const GameEvent = new EventEmitter<IDatabasePayload<GameDocument>>();

export enum GameAccess {
  Private = 'private',
  PrivatePublic = 'private-public',
  Public = 'public',
}

// Delete unused images and videos on update.
GameEvent.sync(async payload => {
  const game = payload.fullDocument;

  switch (payload.operationType) {
    case 'delete':
      return game.removeMinioObjects();

    case 'update':
      return Promise.all([game.removeMinioImages(), game.removeMinioVideos()]);
  }
});

// Delete Games if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Game.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ access: 1 })
@index({ namespaceId: 1 })
@index({ subtitle: 1, title: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'games',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameEvent })
@plugin(uniqueErrorPlugin)
export class GameSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ default: GameAccess.Private, enum: GameAccess })
  public access: GameAccess;

  @prop()
  public background: string;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop()
  public icon: string;

  @arrayProp({ items: String })
  public images: string[];

  @prop({ default: {} })
  public metadata: any;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ match: /^.{2,40}$/ })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, required: true })
  public title: string;

  public updatedAt: Date;

  @arrayProp({ items: String })
  public videos: string[];

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    _id: string | mongoose.Types.ObjectId,
    access: GameAccess,
    namespaceId: string | mongoose.Types.ObjectId,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.games;
    if (limits.count > 0 || limits.public >= 0) {
      const results = await Game.aggregate([
        { $match: { _id: { $ne: _id }, namespaceId: namespace._id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            public: {
              $sum: {
                $cond: {
                  else: 0,
                  if: { $ne: ['$access', GameAccess.Private] },
                  then: 1,
                },
              },
            },
          },
        },
      ]);

      // Count.
      const countSum = results.length > 0 ? results[0].count : 0;
      if (limits.count > 0 && countSum >= limits.count) {
        throw new NamespaceLimitError('games.count', limits.count);
      }

      // Public.
      const isPublic = [GameAccess.PrivatePublic, GameAccess.Public].includes(access);
      const publicSum = results.length > 0 ? results[0].public : 0;
      if (isPublic && publicSum + 1 > limits.public) {
        throw new NamespaceLimitError('games.public', limits.public);
      }
    }
  }

  /**
   * Get the path for the property within Minio.
   */
  public getMinioKey(field?: string, _id?: string) {
    const id = _id || mongoose.Types.ObjectId().toHexString();

    switch (field) {
      case 'background':
        return `namespaces/${this.namespaceId}/games/${this._id}/background`;
      case 'icon':
        return `namespaces/${this.namespaceId}/games/${this._id}/icon`;
      case 'images':
        return `namespaces/${this.namespaceId}/games/${this._id}/images/${id}`;
      case 'videos':
        return `namespaces/${this.namespaceId}/games/${this._id}/videos/${id}`;
      default:
        return `namespaces/${this.namespaceId}/games/${this._id}`;
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
  public async removeMinioImages(this: GameDocument) {
    const prefix = this.getMinioKey() + '/images';
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    for (const object of objects) {
      const _id = object.name.replace(`${prefix}/`, '');
      const image = this.images.find(i => i.includes(`images/${_id}`));

      if (!image) {
        await minio.removeObject(process.env.MINIO_BUCKET, object.name);
      }
    }
  }

  /**
   * Removes all objects from Minio.
   */
  public async removeMinioObjects(this: GameDocument) {
    const prefix = this.getMinioKey();
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    const promises = objects.map(o => minio.removeObject(process.env.MINIO_BUCKET, o.name));
    return Promise.all(promises);
  }

  /**
   * Removes unusued videos from Minio.
   */
  public async removeMinioVideos(this: GameDocument) {
    const prefix = this.getMinioKey() + '/videos';
    const objects = await minio.listObjects(process.env.MINIO_BUCKET, prefix);

    for (const object of objects) {
      const _id = object.name.replace(`${prefix}/`, '');
      const video = this.videos.find(i => i.includes(`videos/${_id}`));

      if (!video) {
        await minio.removeObject(process.env.MINIO_BUCKET, object.name);
      }
    }
  }
}

export type GameDocument = DocumentType<GameSchema>;
export type GameModel = ReturnModelType<typeof GameSchema>;
export const Game = getModelForClass(GameSchema);
