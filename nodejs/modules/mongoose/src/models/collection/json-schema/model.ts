import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  alphabeticalKeysValidator,
  entryLengthValidator,
  keyLengthValidator,
} from '../../../validators';
import {
  CollectionJsonSchemaPropertiesDocument,
  CollectionJsonSchemaPropertiesSchema,
  CollectionJsonSchemaType,
} from './properties';

@modelOptions({ schemaOptions: { _id: false } })
export class CollectionJsonSchemaSchema {
  @prop(
    {
      required: true,
      type: () => CollectionJsonSchemaPropertiesSchema,
      validate: [
        alphabeticalKeysValidator,
        entryLengthValidator(Infinity, 1),
        keyLengthValidator(32),
      ],
    },
    PropType.MAP,
  )
  public properties: Map<string, CollectionJsonSchemaPropertiesDocument>;

  @prop({ maxlength: 128, trim: true, type: String }, PropType.ARRAY)
  public required: string[];

  @prop({ enum: [CollectionJsonSchemaType.Object], required: true, type: String })
  public type: CollectionJsonSchemaType.Object;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionJsonSchemaModel,
    values: Partial<CollectionJsonSchemaSchema> = {},
  ) {
    const defaults = {
      properties: { key: { type: 'boolean' } },
      type: CollectionJsonSchemaType.Object,
    };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionJsonSchemaDocument = DocumentType<CollectionJsonSchemaSchema>;
export const CollectionJsonSchemaModel = getModelForClass(CollectionJsonSchemaSchema, {
  existingMongoose: mongoose,
});
