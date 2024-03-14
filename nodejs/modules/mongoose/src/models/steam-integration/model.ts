import {
  DocumentType,
  PropType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationRole } from '../authorization';

@index({ apiKey: 1, applicationId: 1, namespaceId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'steam-integrations', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class SteamIntegrationSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public apiKey: string;

  @prop({ required: true, type: Number })
  public applicationId: number;

  public createdAt: Date;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String }, PropType.ARRAY)
  public roles: AuthorizationRole[];

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: SteamIntegrationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof SteamIntegrationModel,
    values: Partial<SteamIntegrationSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      apiKey: chance.hash({ length: 32 }),
      applicationId: chance.integer(),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type SteamIntegrationDocument = DocumentType<SteamIntegrationSchema>;
export const SteamIntegrationModel = getModelForClass(SteamIntegrationSchema);
