import { RefreshTokenSchema as BaseRefreshTokenSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';

export class RefreshTokenSchema extends BaseRefreshTokenSchema {}
export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export type RefreshTokenModel = ReturnModelType<typeof RefreshTokenSchema>;
export const RefreshToken = getModelForClass(RefreshTokenSchema);
