import { AuthorizationRequestSchema as BaseAuthorizationRequestSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';

export class AuthorizationRequestSchema extends BaseAuthorizationRequestSchema {}
export type AuthorizationRequestDocument = DocumentType<AuthorizationRequestSchema>;
export type AuthorizationRequestModel = ReturnModelType<typeof AuthorizationRequestSchema>;
export const AuthorizationRequest = getModelForClass(AuthorizationRequestSchema);
