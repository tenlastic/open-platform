import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { plugin as uniqueErrorPlugin } from '../plugin';

@index({ createdAt: 1 })
@index({ name: 1 }, { unique: true })
@index({ updatedAt: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: false,
    collection: 'uniques',
    timestamps: true,
  },
})
@plugin(uniqueErrorPlugin)
export class UniqueSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public name: string;

  public updatedAt: Date;
}

export type UniqueDocument = DocumentType<UniqueSchema>;
export type UniqueModel = ReturnModelType<typeof UniqueSchema>;
export const Unique = getModelForClass(UniqueSchema);
