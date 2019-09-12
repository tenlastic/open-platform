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
    autoIndex: false,
    minimize: false,
    timestamps: true,
  },
})
export class UserRolesSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @arrayProp({ default: [], enum: Object.values(UserRole), items: String })
  public roles: string[];

  @prop({ ref: ReadonlyUserSchema, required: true })
  public userId: Ref<ReadonlyUserDocument>;

  public updatedAt: Date;
}

export type UserRolesDocument = DocumentType<UserRolesSchema>;
export type UserRolesModel = ReturnModelType<typeof UserRolesSchema>;
export const UserRoles = getModelForClass(UserRolesSchema);
