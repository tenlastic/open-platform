import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { UserDocument, UserSchema } from '../../user';

export enum UserRole {
  Administrator = 'Administrator',
}

@modelOptions({
  schemaOptions: {
    _id: false,
    autoIndex: true,
    minimize: false,
    timestamps: true,
  },
})
export class UserRolesSchema {
  @arrayProp({ default: [], enum: Object.values(UserRole), items: String })
  public roles: string[];

  @prop({ ref: UserSchema, required: true })
  public userId: Ref<UserDocument>;
}

export type UserRolesDocument = DocumentType<UserRolesSchema>;
export type UserRolesModel = ReturnModelType<typeof UserRolesSchema>;
export const UserRoles = getModelForClass(UserRolesSchema);
