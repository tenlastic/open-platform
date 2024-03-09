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

@index({ appId: 1, namespaceId: 1, value: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'steam-api-keys', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class SteamApiKeySchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: Number })
  public appId: number;

  public createdAt: Date;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public value: string;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: SteamApiKeyDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof SteamApiKeyModel, values: Partial<SteamApiKeySchema> = {}) {
    const chance = new Chance();
    const defaults = {
      appId: chance.integer(),
      namespaceId: new mongoose.Types.ObjectId(),
      value: chance.hash({ length: 32 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type SteamApiKeyDocument = DocumentType<SteamApiKeySchema>;
export const SteamApiKeyModel = getModelForClass(SteamApiKeySchema);
