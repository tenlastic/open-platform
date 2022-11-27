import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildFileSchema {
  @prop({ required: true, type: Number })
  public compressedBytes: number;

  @prop({ required: true, type: String })
  public md5: string;

  @prop({ required: true, type: String })
  public path: string;

  @prop({ required: true, type: Number })
  public uncompressedBytes: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: BuildFileModel, values: Partial<BuildFileSchema> = {}) {
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
export type BuildFileModel = ReturnModelType<typeof BuildFileSchema>;
export const BuildFile = getModelForClass(BuildFileSchema);
