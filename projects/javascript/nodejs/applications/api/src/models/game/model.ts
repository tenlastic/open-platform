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

import { Namespace, NamespaceDocument } from '../namespace';

export const GameEvent = new EventEmitter<IDatabasePayload<GameDocument>>();
GameEvent.on(payload => {
  kafka.publish(payload);
});

@index({ slug: 1 }, { unique: true })
@index({ subtitle: 1, title: 1 }, { unique: true })
@index({ namespaceId: 1 })
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

  @prop({ ref: Namespace, required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ match: /^[0-9a-z\-]{2,40}$/, required: true })
  public slug: string;

  @prop({ match: /^.{2,40}$/ })
  public subtitle: string;

  @prop({ match: /^.{2,40}$/, required: true })
  public title: string;

  public updatedAt: Date;

  @arrayProp({ items: String })
  public videos: string[];

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: Namespace })
  public namespaceDocument: NamespaceDocument;

  /**
   * Get the path for the property within Minio.
   */
  public getMinioPath(field: string, _id?: string) {
    const id = _id || mongoose.Types.ObjectId().toHexString();

    switch (field) {
      case 'background':
        return `games/${this.slug}/background`;
      case 'icon':
        return `games/${this.slug}/icon`;
      case 'images':
        return `games/${this.slug}/images/${id}`;
      case 'videos':
        return `games/${this.slug}/videos/${id}`;
      default:
        return null;
    }
  }

  /**
   * Get the path for the property within Minio.
   */
  public getUrl(host: string, protocol: string, path: string) {
    const base = `${protocol}://${host}`;
    return `${base}/${path}`;
  }
}

export type GameDocument = DocumentType<GameSchema>;
export type GameModel = ReturnModelType<typeof GameSchema>;
export const Game = getModelForClass(GameSchema);
