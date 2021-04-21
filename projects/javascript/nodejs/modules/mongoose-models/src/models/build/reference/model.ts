import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { BuildDocument } from '../';

@modelOptions({ schemaOptions: { _id: false } })
export class BuildReferenceSchema {
  @prop({ ref: 'BuildSchema', required: true })
  public _id: Ref<BuildDocument>;

  @arrayProp({ items: String })
  public files: string[];
}

export type BuildReferenceDocument = DocumentType<BuildReferenceSchema>;
export type BuildReferenceModel = ReturnModelType<typeof BuildReferenceSchema>;
export const BuildReference = getModelForClass(BuildReferenceSchema);
