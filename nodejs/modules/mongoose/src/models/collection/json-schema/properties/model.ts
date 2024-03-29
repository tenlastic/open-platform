import { DocumentType, getModelForClass, modelOptions, prop, Severity } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  CollectionJsonSchemaArrayDocument,
  CollectionJsonSchemaArraySchema,
  CollectionJsonSchemaType,
} from './array';

@modelOptions({ options: { allowMixed: Severity.ALLOW }, schemaOptions: { _id: false } })
export class CollectionJsonSchemaPropertiesSchema {
  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public default: any;

  @prop({ type: String })
  public format: string;

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
    this: typeof CollectionJsonSchemaPropertiesModel,
    values: Partial<CollectionJsonSchemaPropertiesSchema> = {},
  ) {
    const defaults = { type: CollectionJsonSchemaType.Boolean };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaPropertiesDocument =
  DocumentType<CollectionJsonSchemaPropertiesSchema>;
export const CollectionJsonSchemaPropertiesModel = getModelForClass(
  CollectionJsonSchemaPropertiesSchema,
);
