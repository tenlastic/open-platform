import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument, AuthorizationRole } from '../authorization';

export interface SteamIntegration {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  apiKey: string;
  applicationId: number;
  createdAt?: Date;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  roles?: AuthorizationRole[];
  updatedAt?: Date;
}

export type SteamIntegrationDocument = mongoose.Document<mongoose.Types.ObjectId> &
  SteamIntegration;

export interface SteamIntegrationModelType extends mongoose.Model<SteamIntegrationDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: SteamIntegrationModelType,
    values?: Partial<SteamIntegration>,
  ): SteamIntegrationDocument;
}

const SteamIntegrationSchema = new mongoose.Schema<
  SteamIntegrationDocument,
  SteamIntegrationModelType
>(
  {
    apiKey: { maxlength: 64, required: true, trim: true, type: String },
    applicationId: { required: true, type: Number },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    roles: { enum: AuthorizationRole, type: [String] },
  },
  { collection: 'steam-integrations', timestamps: true },
);

SteamIntegrationSchema.index({ apiKey: 1, applicationId: 1, namespaceId: 1 }, { unique: true });

SteamIntegrationSchema.plugin(duplicateKeyErrorPlugin);
SteamIntegrationSchema.plugin(unsetPlugin);

SteamIntegrationSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: 'namespaceId',
  foreignField: 'namespaceId',
});

SteamIntegrationSchema.statics.mock = function (values: Partial<SteamIntegration> = {}) {
  const chance = new Chance();
  const defaults: Partial<SteamIntegration> = {
    apiKey: chance.hash({ length: 32 }),
    applicationId: chance.integer(),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const SteamIntegrationModel = mongoose.model<
  SteamIntegrationDocument,
  SteamIntegrationModelType
>('SteamIntegrationSchema', SteamIntegrationSchema);

export { SteamIntegrationSchema };

export default SteamIntegrationModel;
