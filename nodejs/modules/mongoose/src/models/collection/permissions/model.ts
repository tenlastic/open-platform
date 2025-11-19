import * as mongoose from 'mongoose';

import { parseMapValues, stringifyMapValues } from '../../../transforms';
import { alphabeticalKeysValidator, excludeKeysValidator } from '../../../validators';

const keys = ['default', 'namespace-read', 'namespace-write', 'user-read', 'user-write'];
const validate = [alphabeticalKeysValidator, excludeKeysValidator(keys)];

export interface CollectionPermissions {
  create?: Map<string, string[]>;
  delete?: Map<string, boolean>;
  find?: Map<string, unknown>;
  read?: Map<string, string[]>;
  roles?: Map<string, unknown>;
  update?: Map<string, string[]>;
}

export type CollectionPermissionsDocument = mongoose.Document<mongoose.Types.ObjectId> &
  CollectionPermissions;

export interface CollectionPermissionsModelType
  extends mongoose.Model<CollectionPermissionsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: CollectionPermissionsModelType,
    values?: Partial<CollectionPermissions>,
  ): CollectionPermissionsDocument;
}

const CollectionPermissionsSchema = new mongoose.Schema<
  CollectionPermissionsDocument,
  CollectionPermissionsModelType
>(
  {
    create: { type: Map, of: [String], validate },
    delete: { type: Map, of: Boolean, validate },
    find: {
      get: parseMapValues,
      of: mongoose.Schema.Types.Mixed,
      set: stringifyMapValues,
      type: Map,
      validate,
    },
    read: { type: Map, of: [String], validate },
    roles: {
      get: parseMapValues,
      of: mongoose.Schema.Types.Mixed,
      set: stringifyMapValues,
      type: Map,
      validate,
    },
    update: { type: Map, of: [String], validate },
  },
  {
    _id: false,
    minimize: false,
  },
);

CollectionPermissionsSchema.statics.mock = function (values: Partial<CollectionPermissions> = {}) {
  const defaults: Partial<CollectionPermissions> = {};

  return new this({ ...defaults, ...values });
};

export const CollectionPermissionsModel = mongoose.model<
  CollectionPermissionsDocument,
  CollectionPermissionsModelType
>('CollectionPermissionsSchema', CollectionPermissionsSchema);

export { CollectionPermissionsSchema };

export default CollectionPermissionsModel;
