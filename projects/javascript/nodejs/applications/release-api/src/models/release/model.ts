import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
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
import * as mongoose from 'mongoose';

import { ReadonlyGame, ReadonlyGameDocument } from '../readonly-game';

export const ReleaseEvent = new EventEmitter<IDatabasePayload<ReleaseDocument>>();
ReleaseEvent.on(kafka.publish);

export enum ReleasePlatform {
  Windows64 = 'windows64',
  Windows32 = 'windows32',
  Mac64 = 'mac64',
  Mac32 = 'mac32',
  Linux64 = 'linux64',
  Linux32 = 'linux32',
}

@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'releases',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ReleaseEvent,
})
export class ReleaseSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public executableRelativePath: string;

  @prop({ ref: ReadonlyGame, required: true })
  public gameId: Ref<ReadonlyGameDocument>;

  @prop({ enum: ReleasePlatform, required: true })
  public platform: ReleasePlatform;

  @prop()
  public publishedAt: Date;

  @prop({ required: true })
  public serverRootUrl: string;

  @prop({ required: true })
  public version: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: ReadonlyGame })
  public gameDocument: ReadonlyGameDocument;
}

export type ReleaseDocument = DocumentType<ReleaseSchema>;
export type ReleaseModel = ReturnModelType<typeof ReleaseSchema>;
export const Release = getModelForClass(ReleaseSchema);
