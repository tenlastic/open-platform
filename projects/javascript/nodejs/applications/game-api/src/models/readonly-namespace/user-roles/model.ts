import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { ReadonlyUserDocument, ReadonlyUserSchema } from '../../readonly-user';

export enum UserRole {
  Administrator = 'Administrator',
}

@modelOptions({
  schemaOptions: {
    _id: false,
    minimize: false,
  },
})
export class UserRolesSchema {
  @prop()
  public _id: mongoose.Types.ObjectId;

  @prop()
  public createdAt: Date;

  @arrayProp({ items: String })
  public roles: string[];

  @prop({ ref: ReadonlyUserSchema })
  public userId: Ref<ReadonlyUserDocument>;

  @prop()
  public updatedAt: Date;
}

export type UserRolesDocument = DocumentType<UserRolesSchema>;
export type UserRolesModel = ReturnModelType<typeof UserRolesSchema>;
export const UserRoles = getModelForClass(UserRolesSchema);
