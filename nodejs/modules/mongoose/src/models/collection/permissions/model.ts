import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

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
export class CollectionModelPermissionsSchema {
  @prop({ type: [String], validate }, PropType.MAP)
  public create: Map<string, string[]>;

  @prop({ type: Boolean, validate }, PropType.MAP)
  public delete: Map<string, boolean>;

  @prop({ type: mongoose.Schema.Types.Mixed, validate }, PropType.MAP)
  public find: Map<string, any>;

  @prop({ type: [String], validate }, PropType.MAP)
  public read: Map<string, string[]>;

  @prop({ type: mongoose.Schema.Types.Mixed, validate }, PropType.MAP)
  public roles: Map<string, any>;

  @prop({ type: [String], validate }, PropType.MAP)
  public update: Map<string, string[]>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: CollectionModelPermissionsModel,
    values: Partial<CollectionModelPermissionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }

  /**
   * Converts find and roles values from Strings to Objects.
   */
   public getter(this: CollectionModelPermissionsDocument) {
    if (this.find) {
      this.find = this.getObjectValues(this.find);
    }

    if (this.roles) {
      this.roles = this.getObjectValues(this.roles);
    }

    return this;
  }

  /**
   * Converts find and roles values from Objects to String.
   */
  public setter(this: CollectionModelPermissionsDocument) {
    if (this.find) {
      this.find = this.getStringValues(this.find);
    }

    if (this.roles) {
      this.roles = this.getStringValues(this.roles);
    }

    return this;
  }

  /**
   * Converts Map values from JSON strings to Objects.
   */
  private getObjectValues(value: any): any {
    value = value.toJSON ? value.toJSON() : value;

    return Object.entries(value).reduce((previous, [k, v]) => {
      previous.set(k, typeof v === 'string' ? JSON.parse(v) : v);
      return previous;
    }, new mongoose.Types.Map());
  }

  /**
   * Converts Map values from Objects to JSON strings.
   */
  private getStringValues(value: any): any {
    value = value.toJSON ? value.toJSON() : value;

    return Object.entries(value).reduce((previous, [k, v]) => {
      previous.set(k, typeof v === 'string' ? v : JSON.stringify(v));
      return previous;
    }, new mongoose.Types.Map());
  }
}

export type CollectionModelPermissionsDocument = DocumentType<CollectionModelPermissionsSchema>;
export type CollectionModelPermissionsModel = ReturnModelType<
  typeof CollectionModelPermissionsSchema
>;
export const CollectionModelPermissions = getModelForClass(CollectionModelPermissionsSchema);
