import * as mongoose from 'mongoose';

interface JsonSchema {
  [key: string]: any;
  default?: any;
  format?: string;
  enum?: any[];
  items?: JsonSchema;
  pattern?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  type: JsonSchemaType | string;
}

type JsonSchemaType = 'array' | 'boolean' | 'integer' | 'number' | 'object' | 'string';

export function jsonToMongoose(jsonSchema: JsonSchema): mongoose.Schema {
  const schema: Record<string, mongoose.SchemaType<any> | mongoose.Schema> = {};

  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  for (const [key, value] of Object.entries(properties)) {
    let field: mongoose.SchemaType<any> | any = {};

    switch (value.type) {
      case 'array':
        field.type = [convertType(value.items!)];
        break;

      case 'boolean':
        field.type = Boolean;
        break;

      case 'integer':
      case 'number':
        if (value.enum !== undefined) {
          field.enum = value.enum;
        }
        if (value.maximum !== undefined) {
          field.max = value.maximum;
        }
        if (value.minimum !== undefined) {
          field.min = value.minimum;
        }
        field.type = Number;
        break;

      case 'object':
        if (value.properties) {
          field = jsonToMongoose(value);
        } else {
          field.type = mongoose.Schema.Types.Mixed;
        }
        break;

      case 'string':
        if (value.enum !== undefined) {
          field.enum = value.enum;
        }
        if (value.maxLength !== undefined) {
          field.maxlength = value.maxLength;
        }
        if (value.minLength !== undefined) {
          field.minlength = value.minLength;
        }
        if (value.pattern !== undefined && value.pattern !== '^[0-9A-Fa-f]{24}$') {
          field.match = new RegExp(value.pattern);
        }
        if (value.format === 'date-time') {
          field.type = Date;
        } else if (value.pattern === '^[0-9A-Fa-f]{24}$') {
          field.type = mongoose.Schema.Types.ObjectId;
        } else {
          field.type = String;
        }
        break;

      default:
        throw new Error(`Unsupported JSON schema type: ${value.type}.`);
    }

    if (required.includes(key)) {
      field.required = true;
    }

    if (value.default !== undefined) {
      field.default = value.default;
    }

    schema[key] = field;
  }

  if (Object.keys(properties).length === 0) {
    return convertType(jsonSchema);
  }

  return new mongoose.Schema(schema, { _id: false });
}

function convertType(schema: JsonSchema): any {
  switch (schema.type) {
    case 'array':
      return [convertType(schema.items!)];
    case 'boolean':
      return Boolean;
    case 'integer':
    case 'number':
      return Number;
    case 'object':
      return jsonToMongoose(schema);
    case 'string':
      return String;
    default:
      throw new Error(`Unsupported JSON schema type: ${schema.type}.`);
  }
}
