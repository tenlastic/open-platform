import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildFileSchema {
  @prop({ required: true, type: Number })
  public compressedBytes: number;

  @prop({ maxlength: 128, required: true, trim: true, type: String })
  public md5: string;

  @prop({ maxlength: 256, required: true, trim: true, type: String })
  public path: string;

  @prop({ required: true, type: Number })
  public uncompressedBytes: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof BuildFileModel, values: Partial<BuildFileSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      compressedBytes: chance.integer(),
      md5: chance.hash(),
      path: chance.hash(),
      uncompressedBytes: chance.integer(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type BuildFileDocument = DocumentType<BuildFileSchema>;
export const BuildFileModel = getModelForClass(BuildFileSchema);
