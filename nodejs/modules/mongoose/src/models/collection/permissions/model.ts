import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
  Severity,
  PropType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, id: false, minimize: false },
})
export class CollectionPermissionsSchema {
  @prop({ type: [String] }, PropType.MAP)
  public create: Map<string, string[]>;

  @prop({ type: Boolean }, PropType.MAP)
  public delete: Map<string, boolean>;

  @prop({ type: mongoose.Schema.Types.Mixed }, PropType.MAP)
  public find: Map<string, any>;

  @prop({ type: [String] }, PropType.MAP)
  public read: Map<string, string[]>;

  @prop({ type: mongoose.Schema.Types.Mixed }, PropType.MAP)
  public roles: Map<string, any>;

  @prop({ type: [String] }, PropType.MAP)
  public update: Map<string, string[]>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: CollectionPermissionsModel,
    values: Partial<CollectionPermissionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type CollectionPermissionsDocument = DocumentType<CollectionPermissionsSchema>;
export type CollectionPermissionsModel = ReturnModelType<typeof CollectionPermissionsSchema>;
export const CollectionPermissions = getModelForClass(CollectionPermissionsSchema);
