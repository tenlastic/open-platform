import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

@index({ namespaceId: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'storefronts', timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class StorefrontSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ filter: { create: true, update: true }, maxlength: 256, trim: true, type: String })
  public background: string;

  public createdAt: Date;

  @prop({ maxlength: 5120, trim: true, type: String })
  public description: string;

  @prop({ filter: { create: true, update: true }, maxlength: 256, trim: true, type: String })
  public icon: string;

  @prop(
    { filter: { create: true, update: true }, maxlength: 256, trim: true, type: String },
    PropType.ARRAY,
  )
  public images: string[];

  @prop({ filter: { create: true, update: true }, maxlength: 256, trim: true, type: String })
  public logo: string;

  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public metadata: any;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ maxlength: 32, type: String })
  public subtitle: string;

  @prop({ maxlength: 32, required: true, type: String })
  public title: string;

  public updatedAt: Date;

  @prop(
    { filter: { create: true, update: true }, maxlength: 256, trim: true, type: String },
    PropType.ARRAY,
  )
  public videos: string[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof StorefrontModel, values: Partial<StorefrontSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      title: chance.hash({ length: 32 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type StorefrontDocument = DocumentType<StorefrontSchema>;
export const StorefrontModel = getModelForClass(StorefrontSchema);
