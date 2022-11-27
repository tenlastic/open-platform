import { SchemaSchema as BaseSchemaSchema } from '@tenlastic/mongoose';
import { DocumentType, getModelForClass, ReturnModelType } from '@typegoose/typegoose';

export class SchemaSchema extends BaseSchemaSchema {}
export type SchemaDocument = DocumentType<SchemaSchema>;
export type SchemaModel = ReturnModelType<typeof SchemaSchema>;
export const Schema = getModelForClass(SchemaSchema);
