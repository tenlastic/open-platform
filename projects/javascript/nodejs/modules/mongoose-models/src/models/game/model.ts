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
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { NamespaceDocument, NamespaceEvent } from '../namespace';

export const GameEvent = new EventEmitter<IDatabasePayload<GameDocument>>();
GameEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Games if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Game.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1 }, { unique: true })
@index({ subtitle: 1, title: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'games',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameEvent,
})
@plugin(uniqueErrorPlugin)
export class GameSchema {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public background: string;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop()
  public icon: string;

  @arrayProp({ items: String })
  public images: string[];

  @prop({ ref: 'NamespaceSchema', required: true })
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
   * Get the path for the property within Minio.
   */
  public getMinioKey(field: string, _id?: string) {
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
        return null;
    }
  }

  /**
   * Get the URL for the property within Minio.
   */
  public getUrl(host: string, protocol: string, path: string) {
    const base = `${protocol}://${host}`;
    return `${base}/${path}`;
  }
}

export type GameDocument = DocumentType<GameSchema>;
export type GameModel = ReturnModelType<typeof GameSchema>;
export const Game = getModelForClass(GameSchema);
