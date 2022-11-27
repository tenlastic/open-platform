import { QueueMemberSchema as BaseQueueMemberSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

export class QueueMemberSchema extends BaseQueueMemberSchema {}
export type QueueMemberDocument = mongoose.Document & DocumentType<QueueMemberSchema>;
export type QueueMemberModel = ReturnModelType<typeof QueueMemberSchema>;
export const QueueMember = getModelForClass(QueueMemberSchema);
