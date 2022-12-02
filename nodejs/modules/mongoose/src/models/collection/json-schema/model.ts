import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import {
  CollectionJsonSchemaPropertiesDocument,
  CollectionJsonSchemaPropertiesSchema,
  CollectionJsonSchemaType,
} from './properties';

@modelOptions({ schemaOptions: { _id: false } })
export class CollectionJsonSchemaSchema {
  @prop()
  additionalProperties: boolean;

  @prop({ required: true, type: () => CollectionJsonSchemaPropertiesSchema }, PropType.MAP)
  public properties: Map<string, CollectionJsonSchemaPropertiesDocument>;

  @prop({ maxlength: 128, trim: true, type: String }, PropType.ARRAY)
  public required: string[];

  @prop({ enum: [CollectionJsonSchemaType.Object], required: true, type: String })
  public type: CollectionJsonSchemaType.Object;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: CollectionJsonSchemaModel,
    values: Partial<CollectionJsonSchemaSchema> = {},
  ) {
    const defaults = { properties: {}, type: CollectionJsonSchemaType.Object };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaDocument = DocumentType<CollectionJsonSchemaSchema>;
export type CollectionJsonSchemaModel = ReturnModelType<typeof CollectionJsonSchemaSchema>;
export const CollectionJsonSchema = getModelForClass(CollectionJsonSchemaSchema);
