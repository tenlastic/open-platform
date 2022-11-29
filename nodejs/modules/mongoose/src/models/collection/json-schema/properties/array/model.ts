import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { CollectionJsonSchemaType } from '../../model';

@modelOptions({ schemaOptions: { _id: false, minimize: false } })
export class CollectionJsonSchemaArraySchema {
  @prop({
    enum: [
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
    this: CollectionJsonSchemaArrayModel,
    values: Partial<CollectionJsonSchemaArraySchema> = {},
  ) {
    const defaults = { type: CollectionJsonSchemaType.Boolean };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaArrayDocument = DocumentType<CollectionJsonSchemaArraySchema>;
export type CollectionJsonSchemaArrayModel = ReturnModelType<
  typeof CollectionJsonSchemaArraySchema
>;
export const CollectionJsonSchemaArray = getModelForClass(CollectionJsonSchemaArraySchema);
