import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { Minio, MinioSchema } from './minio';
import { Mongodb, MongodbSchema } from './mongodb';
import { Nats, NatsSchema } from './nats';

@modelOptions({ schemaOptions: { _id: false } })
export class ResourcesSchema {
  @prop({ default: () => new Minio() })
  public minio: MinioSchema;

  @prop({ default: () => new Mongodb() })
  public mongodb: MongodbSchema;

  @prop({ default: () => new Nats() })
  public nats: NatsSchema;
}

export type ResourcesSchemaDocument = DocumentType<ResourcesSchema>;
export type ResourcesSchemaModel = ReturnModelType<typeof ResourcesSchema>;
export const Resources = getModelForClass(ResourcesSchema);
