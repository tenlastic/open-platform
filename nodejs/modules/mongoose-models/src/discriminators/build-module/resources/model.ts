import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { MinioSchema } from '../minio';

@modelOptions({ schemaOptions: { _id: false } })
export class ResourcesSchema {
  @prop()
  public minio: MinioSchema;
}

export type ResourcesSchemaDocument = DocumentType<ResourcesSchema>;
export type ResourcesSchemaModel = ReturnModelType<typeof ResourcesSchema>;
export const Resources = getModelForClass(ResourcesSchema);
