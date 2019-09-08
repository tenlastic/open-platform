import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, plugin, prop } from 'typegoose';

import { plugin as uniqueErrorPlugin } from '../plugin';

@index({ createdAt: 1 })
@index({ name: 1 }, { unique: true })
@index({ updatedAt: 1 })
@plugin(uniqueErrorPlugin)
export class UniqueSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public name: string;

  public updatedAt: Date;
}

export type UniqueDocument = InstanceType<UniqueSchema>;
export type UniqueModel = ModelType<UniqueSchema>;
export const Unique = new UniqueSchema().getModelForClass(UniqueSchema, {
  schemaOptions: {
    collection: 'uniques',
    timestamps: true,
  },
});
