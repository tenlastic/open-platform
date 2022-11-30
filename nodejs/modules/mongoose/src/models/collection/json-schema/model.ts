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

export enum CollectionJsonSchemaType {
  Array = 'array',
  Boolean = 'boolean',
  Integer = 'integer',
  Null = 'null',
  Number = 'number',
  Object = 'object',
  String = 'string',
}

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, minimize: false },
})
export class CollectionJsonSchemaSchema {
  @prop()
  additionalProperties: boolean;

  @prop({ required: true, type: () => CollectionChildJsonSchemaSchema }, PropType.MAP)
  public properties: Map<string, CollectionChildJsonSchemaSchema>;

  @prop({ type: String }, PropType.ARRAY)
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

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, minimize: false },
})
export class CollectionArrayJsonSchemaSchema {
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
    this: CollectionArrayJsonSchemaModel,
    values: Partial<CollectionArrayJsonSchemaSchema> = {},
  ) {
    const defaults = { type: CollectionJsonSchemaType.Boolean };

    return new this({ ...defaults, ...values });
  }
}

@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { _id: false, minimize: false },
})
export class CollectionChildJsonSchemaSchema {
  @prop({ type: mongoose.Schema.Types.Mixed, unset: false })
  public default: any;

  @prop({ type: CollectionArrayJsonSchemaSchema })
  public items: CollectionArrayJsonSchemaDocument;

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
    this: CollectionChildJsonSchemaModel,
    values: Partial<CollectionChildJsonSchemaSchema> = {},
  ) {
    const defaults = { type: CollectionJsonSchemaType.Boolean };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaDocument = DocumentType<CollectionJsonSchemaSchema>;
export type CollectionJsonSchemaModel = ReturnModelType<typeof CollectionJsonSchemaSchema>;
export const CollectionJsonSchema = getModelForClass(CollectionJsonSchemaSchema);

export type CollectionArrayJsonSchemaDocument = DocumentType<CollectionArrayJsonSchemaSchema>;
export type CollectionArrayJsonSchemaModel = ReturnModelType<
  typeof CollectionArrayJsonSchemaSchema
>;
export const CollectionArrayJsonSchema = getModelForClass(CollectionArrayJsonSchemaSchema);

export type CollectionChildJsonSchemaDocument = DocumentType<CollectionChildJsonSchemaSchema>;
export type CollectionChildJsonSchemaModel = ReturnModelType<
  typeof CollectionChildJsonSchemaSchema
>;
export const CollectionChildJsonSchema = getModelForClass(CollectionChildJsonSchemaSchema);
