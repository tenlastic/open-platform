export interface JsonSchema {
  additionalProperties?: boolean | { [key: string]: JsonSchema };
  default?: unknown;
  enum?: number[] | string[];
  format?: string;
  items?: JsonSchema;
  maximum?: number;
  maxLength?: number;
  minimum?: number;
  minLength?: number;
  pattern?: string;
  properties?: { [key: string]: JsonSchema };
  required?: string[];
  type?: JsonSchemaType;
}

export interface BsonSchema extends JsonSchema {
  additionalProperties?: boolean | { [key: string]: BsonSchema };
  bsonType?: BsonSchemaType[];
  items?: BsonSchema;
  properties?: { [key: string]: BsonSchema };
}

export enum BsonSchemaType {
  Array = 'array',
  Boolean = 'bool',
  Date = 'date',
  Double = 'double',
  Integer = 'int',
  Null = 'null',
  Number = 'number',
  Object = 'object',
  String = 'string',
}

export enum JsonSchemaType {
  Array = 'array',
  Boolean = 'boolean',
  Integer = 'integer',
  Null = 'null',
  Number = 'number',
  Object = 'object',
  String = 'string',
}
