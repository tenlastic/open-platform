import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildReferenceSchema {
  @prop({ ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 256, trim: true, type: String }, PropType.ARRAY)
  public files: string[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof BuildReferenceModel, values: Partial<BuildReferenceSchema> = {}) {
    const defaults = { _id: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type BuildReferenceDocument = DocumentType<BuildReferenceSchema>;
export const BuildReferenceModel = getModelForClass(BuildReferenceSchema);
