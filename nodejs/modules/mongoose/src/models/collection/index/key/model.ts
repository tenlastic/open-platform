import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { enumValidator } from '../../../../validators';

@modelOptions({ schemaOptions: { _id: false } })
export class CollectionIndexKeySchema {
  @prop({ default: 1, type: Number, validate: enumValidator([-1, 1]) })
  public direction: number;

  @prop({ match: /^[0-9A-Za-z.]+$/, maxlength: 64, required: true, trim: true, type: String })
  public field: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof CollectionIndexKeyModel,
    values: Partial<CollectionIndexKeySchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { field: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type CollectionIndexKeyDocument = DocumentType<CollectionIndexKeySchema>;
export const CollectionIndexKeyModel = getModelForClass(CollectionIndexKeySchema, {
  existingMongoose: mongoose,
});
