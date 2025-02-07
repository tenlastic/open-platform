import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

@index({ key: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'change-streams', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class ChangeStreamSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public key: string;

  @prop({ maxlength: 256, trim: true, type: String })
  public resumeToken: string;

  public updatedAt: Date;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof ChangeStreamModel, values: Partial<ChangeStreamSchema> = {}) {
    const chance = new Chance();
    const defaults = { key: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type ChangeStreamDocument = DocumentType<ChangeStreamSchema>;
export const ChangeStreamModel = getModelForClass(ChangeStreamSchema);
