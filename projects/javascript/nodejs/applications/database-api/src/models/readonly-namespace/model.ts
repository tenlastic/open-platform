import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { UserRoles, UserRolesDocument } from './user-roles';

@modelOptions({
  schemaOptions: {
    collection: 'readonly.namespaces',
    minimize: false,
  },
})
export class ReadonlyNamespaceSchema {
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

export type ReadonlyNamespaceDocument = DocumentType<ReadonlyNamespaceSchema>;
export type ReadonlyNamespaceModel = ReturnModelType<typeof ReadonlyNamespaceSchema>;
export const ReadonlyNamespace = getModelForClass(ReadonlyNamespaceSchema);
