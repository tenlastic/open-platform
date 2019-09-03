import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, arrayProp, prop } from 'typegoose';

import { UserRoles, UserRolesDocument } from './user-roles';

export class ReadonlyNamespaceSchema extends Typegoose {
  @prop()
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ items: UserRoles })
  public accessControlList: UserRolesDocument[];

  @prop()
  public createdAt: Date;

  @prop()
  public name: string;

  @prop()
  public username: string;
}

export type ReadonlyNamespaceDocument = InstanceType<ReadonlyNamespaceSchema>;
export type ReadonlyNamespaceModel = ModelType<ReadonlyNamespaceSchema>;
export const ReadonlyNamespace = new ReadonlyNamespaceSchema().getModelForClass(
  ReadonlyNamespaceSchema,
  {
    schemaOptions: {
      collection: 'readonly.namespaces',
      minimize: false,
    },
  },
);
