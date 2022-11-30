import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { CollectionJsonSchemaType } from '../model';
import { CollectionJsonSchemaArrayDocument, CollectionJsonSchemaArraySchema } from './array';

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, minimize: false },
})
export class CollectionJsonSchemaPropertiesSchema {
  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public default: any;

  @prop({ type: CollectionJsonSchemaArraySchema })
  public items: CollectionJsonSchemaArrayDocument;

  @prop({
    enum: [
      CollectionJsonSchemaType.Array,
      CollectionJsonSchemaType.Boolean,
      CollectionJsonSchemaType.Integer,
      CollectionJsonSchemaType.Number,
      CollectionJsonSchemaType.String,
    ],
    required: true,
    type: String,
  })
  public type: CollectionJsonSchemaType;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: CollectionJsonSchemaPropertiesModel,
    values: Partial<CollectionJsonSchemaPropertiesSchema> = {},
  ) {
    const defaults = { type: CollectionJsonSchemaType.Boolean };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaPropertiesDocument =
  DocumentType<CollectionJsonSchemaPropertiesSchema>;
export type CollectionJsonSchemaPropertiesModel = ReturnModelType<
  typeof CollectionJsonSchemaPropertiesSchema
>;
export const CollectionJsonSchemaProperties = getModelForClass(
  CollectionJsonSchemaPropertiesSchema,
);
