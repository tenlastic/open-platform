import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { UserRoles, UserRolesDocument } from './user-roles';

@index({ 'accessControlList.roles': 1 })
@index({ 'accessControlList.userIds': 1 })
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
}

export type ReadonlyNamespaceDocument = DocumentType<ReadonlyNamespaceSchema>;
export type ReadonlyNamespaceModel = ReturnModelType<typeof ReadonlyNamespaceSchema>;
export const ReadonlyNamespace = getModelForClass(ReadonlyNamespaceSchema);
