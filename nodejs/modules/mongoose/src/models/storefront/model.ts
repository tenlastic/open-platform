import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument, AuthorizationRole } from '../authorization';

export interface Storefront {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  background?: string;
  createdAt?: Date;
  description?: string;
  icon?: string;
  images?: string[];
  logo?: string;
  metadata?: unknown;
  namespaceId: mongoose.Types.ObjectId;
  roles?: AuthorizationRole[];
  showGameServers?: boolean;
  showQueues?: boolean;
  subtitle?: string;
  title: string;
  updatedAt?: Date;
  videos?: string[];
}

export type StorefrontDocument = mongoose.Document<mongoose.Types.ObjectId> & Storefront;

export interface StorefrontModelType extends mongoose.Model<StorefrontDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: StorefrontModelType, values?: Partial<Storefront>): StorefrontDocument;
}

const StorefrontSchema = new mongoose.Schema<StorefrontDocument, StorefrontModelType>(
  {
    background: {
      filter: { create: true, update: true },
      maxlength: 256,
      trim: true,
      type: String,
    },
    description: { maxlength: 5120, trim: true, type: String },
    icon: { filter: { create: true, update: true }, maxlength: 256, trim: true, type: String },
    images: { filter: { create: true, update: true }, maxlength: 256, trim: true, type: [String] },
    logo: { maxlength: 256, trim: true, type: String },
    metadata: { type: mongoose.Schema.Types.Mixed, unset: false },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    roles: { enum: AuthorizationRole, type: [String] },
    showGameServers: { type: Boolean },
    showQueues: { type: Boolean },
    subtitle: { maxlength: 32, type: String },
    title: { maxlength: 32, required: true, type: String },
    videos: { filter: { create: true, update: true }, maxlength: 256, trim: true, type: [String] },
  },
  { collection: 'storefronts', timestamps: true },
);

StorefrontSchema.index({ namespaceId: 1 }, { unique: true });

StorefrontSchema.plugin(duplicateKeyErrorPlugin);
StorefrontSchema.plugin(unsetPlugin);

StorefrontSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

StorefrontSchema.statics.mock = function (values: Partial<Storefront> = {}) {
  const chance = new Chance();
  const defaults: Partial<Storefront> = {
    namespaceId: new mongoose.Types.ObjectId(),
    title: chance.hash({ length: 32 }),
  };

  return new this({ ...defaults, ...values });
};

export const StorefrontModel = mongoose.model<StorefrontDocument, StorefrontModelType>(
  'StorefrontSchema',
  StorefrontSchema,
);

export { StorefrontSchema };

export default StorefrontModel;
