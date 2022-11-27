import { GroupInvitationSchema as BaseGroupInvitationSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';

export class GroupInvitationSchema extends BaseGroupInvitationSchema {}
export type GroupInvitationDocument = DocumentType<GroupInvitationSchema>;
export type GroupInvitationModel = ReturnModelType<typeof GroupInvitationSchema>;
export const GroupInvitation = getModelForClass(GroupInvitationSchema);
