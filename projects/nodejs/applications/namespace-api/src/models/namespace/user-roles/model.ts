import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

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
  @arrayProp({ default: [], enum: Object.values(UserRole), items: String })
  public roles: string[];

  @prop({ ref: ReadonlyUserSchema, required: true })
  public userId: Ref<ReadonlyUserDocument>;
}

export type UserRolesDocument = DocumentType<UserRolesSchema>;
export type UserRolesModel = ReturnModelType<typeof UserRolesSchema>;
export const UserRoles = getModelForClass(UserRolesSchema);
