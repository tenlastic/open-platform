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

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, id: false, minimize: false },
})
export class CollectionModelPermissionsSchema {
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
    this: CollectionModelPermissionsModel,
    values: Partial<CollectionModelPermissionsSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type CollectionModelPermissionsDocument = DocumentType<CollectionModelPermissionsSchema>;
export type CollectionModelPermissionsModel = ReturnModelType<
  typeof CollectionModelPermissionsSchema
>;
export const CollectionModelPermissions = getModelForClass(CollectionModelPermissionsSchema);
