import { LoginSchema as BaseLoginSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';

export class LoginSchema extends BaseLoginSchema {}
export type LoginDocument = DocumentType<LoginSchema>;
export type LoginModel = ReturnModelType<typeof LoginSchema>;
export const Login = getModelForClass(LoginSchema);
