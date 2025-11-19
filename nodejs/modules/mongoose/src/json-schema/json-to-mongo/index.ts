import { BsonSchema, BsonSchemaType, JsonSchema, JsonSchemaType } from '../types';

const schemaParamsToMongo = {
  enum: (value: unknown[]) => ({ enum: value }),
  maxLength: (value: number) => ({ maxlength: value }),
  maximum: (value: number) => ({ maximum: value }),
  minLength: (value: number) => ({ minlength: value }),
  minimum: (value: number) => ({ minimum: value }),
  pattern: (value: string) => ({ pattern: RegExp(value) }),
  type: (value: string) => ({ bsonType: typeToMongoose[value] }),
};

const typeToMongoose = {
  boolean: ['bool', 'null'],
  number: ['double', 'int', 'null'],
  string: ['null', 'string'],
};

export function jsonToMongo(jsonSchema: JsonSchema): BsonSchema {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
  }

  const typeIsDate = jsonSchema.type === 'string' && jsonSchema.format === 'date-time';
  const typeIsDefined = 'type' in jsonSchema;

  if (typeIsDate) {
    return { bsonType: [BsonSchemaType.Date, BsonSchemaType.Null] };
  } else if (jsonSchema.type in typeToMongoose) {
    return Object.entries(jsonSchema).reduce(toMongoParams, {});
  } else if (jsonSchema.type === JsonSchemaType.Object) {
    return getObjectType(jsonSchema);
  } else if (jsonSchema.type === JsonSchemaType.Array) {
    return getArrayType(jsonSchema);
  } else if (!typeIsDefined) {
    return { bsonType: [BsonSchemaType.Null, BsonSchemaType.Object] };
  }

  throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
}

function getArrayType(jsonSchema: JsonSchema): BsonSchema {
  if (jsonSchema.items && Object.keys(jsonSchema.items).length > 0) {
    return {
      bsonType: [BsonSchemaType.Array, BsonSchemaType.Null],
      items: jsonToMongo(jsonSchema.items),
    };
  }

  return {
    bsonType: [BsonSchemaType.Array, BsonSchemaType.Null],
    items: { bsonType: [BsonSchemaType.Null, BsonSchemaType.Object] },
  };
}

function getObjectType(jsonSchema: JsonSchema): BsonSchema {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return { bsonType: [BsonSchemaType.Null, BsonSchemaType.Object] };
  }

  const properties = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = jsonToMongo(value);
    return previousValue;
  }, {});

  const converted: BsonSchema = {
    bsonType: [BsonSchemaType.Null, BsonSchemaType.Object],
    properties,
  };

  if ('additionalProperties' in jsonSchema) {
    converted.additionalProperties = jsonSchema.additionalProperties;
  }

  if (jsonSchema.required?.length) {
    converted.required = jsonSchema.required;
  }

  return converted;
}

function toMongoParams(previous: unknown, [key, value]) {
  const constructor = schemaParamsToMongo[key];

  if (constructor) {
    return Object.assign(previous, constructor(value));
  }

  return previous;
}
