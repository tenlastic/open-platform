import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { parseMapValues, stringifyMapValues } from '../../../transforms';
import { alphabeticalKeysValidator, excludeKeysValidator } from '../../../validators';

const keys = ['default', 'namespace-read', 'namespace-write', 'user-read', 'user-write'];
const validate = [alphabeticalKeysValidator, excludeKeysValidator(keys)];

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: {
    _id: false,
    minimize: false,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
export class CollectionPermissionsSchema {
  @prop({ type: [String], validate }, PropType.MAP)
  public create: Map<string, string[]>;

  @prop({ type: Boolean, validate }, PropType.MAP)
  public delete: Map<string, boolean>;

  @prop(
    {
      get: (value) => parseMapValues(value),
      set: (value) => stringifyMapValues(value),
      type: mongoose.Schema.Types.Mixed,
      validate,
    },
    PropType.MAP,
  )
  public find: Map<string, any>;

  @prop({ type: [String], validate }, PropType.MAP)
  public read: Map<string, string[]>;

  @prop(
    {
      get: (value) => parseMapValues(value),
      set: (value) => stringifyMapValues(value),
      type: mongoose.Schema.Types.Mixed,
      validate,
    },
    PropType.MAP,
  )
  public roles: Map<string, any>;

  @prop({ type: [String], validate }, PropType.MAP)
  public update: Map<string, string[]>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionPermissionsModel,
    values: Partial<CollectionPermissionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type CollectionPermissionsDocument = DocumentType<CollectionPermissionsSchema>;
export const CollectionPermissionsModel = getModelForClass(CollectionPermissionsSchema);
