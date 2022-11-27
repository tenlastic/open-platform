import { RecordSchema as BaseRecordSchema } from '@tenlastic/mongoose';
import { DocumentType, ReturnModelType } from '@typegoose/typegoose';

export class RecordSchema extends BaseRecordSchema {}
export type RecordDocument = DocumentType<RecordSchema>;
export type RecordModel = ReturnModelType<typeof RecordSchema>;
