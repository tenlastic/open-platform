import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, arrayProp, prop } from 'typegoose';

import { ReadonlyUserDocument, ReadonlyUserSchema } from '../../readonly-user';

export enum UserRole {
  Administrator = 'Administrator',
}

export class UserRolesSchema extends Typegoose {
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

export type UserRolesDocument = InstanceType<UserRolesSchema>;
export type UserRolesModel = ModelType<UserRolesSchema>;
export const UserRoles = new UserRolesSchema().getModelForClass(UserRolesSchema, {
  schemaOptions: {
    _id: false,
    minimize: false,
  },
});
