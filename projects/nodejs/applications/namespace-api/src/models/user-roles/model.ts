import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, arrayProp, prop } from 'typegoose';

import { ReadonlyUserDocument, ReadonlyUserSchema } from '../readonly-user';

export class UserRolesSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @arrayProp({ default: [], items: String })
  public roles: string[];

  @prop({ ref: ReadonlyUserSchema, required: true })
  public userId: Ref<ReadonlyUserDocument>;

  public updatedAt: Date;
}

export type UserRolesDocument = InstanceType<UserRolesSchema>;
export type UserRolesModel = ModelType<UserRolesSchema>;
export const UserRoles = new UserRolesSchema().getModelForClass(UserRolesSchema, {
  schemaOptions: {
    autoIndex: false,
    minimize: false,
    timestamps: true,
  },
});
