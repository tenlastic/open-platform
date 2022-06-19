const schemaParamsToMongo = {
  enum: (value: any[]) => ({ enum: value }),
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

export function toMongo(jsonSchema: any) {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
  }

  const typeIsDate = jsonSchema.type === 'string' && jsonSchema.format === 'date-time';
  const typeIsDefined = 'type' in jsonSchema;

  if (typeIsDate) {
    return { bsonType: ['date', 'null'] };
  } else if (jsonSchema.type in typeToMongoose) {
    return Object.entries(jsonSchema).reduce(toMongoParams, {});
  } else if (jsonSchema.type === 'object') {
    return getObjectType(jsonSchema);
  } else if (jsonSchema.type === 'array') {
    return getArrayType(jsonSchema);
  } else if (!typeIsDefined) {
    return { bsonType: ['null', 'object'] };
  }

  throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
}

function getArrayType(jsonSchema: any) {
  if (jsonSchema.items && Object.keys(jsonSchema.items).length > 0) {
    return { bsonType: ['array', 'null'], items: toMongo(jsonSchema.items) };
  }

  return { bsonType: ['array', 'null'], items: { bsonType: ['null', 'object'] } };
}

function getObjectType(jsonSchema: any) {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return { bsonType: ['null', 'object'] };
  }

  const properties = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = toMongo(value);
    return previousValue;
  }, {});

  const converted: any = { bsonType: ['null', 'object'], properties };

  if ('additionalProperties' in jsonSchema) {
    converted.additionalProperties = jsonSchema.additionalProperties;
  }

  if ('required' in jsonSchema) {
    converted.required = jsonSchema.required;
  }

  return converted;
}

function toMongoParams(acc: any, [key, value]) {
  const constructor = schemaParamsToMongo[key];

  if (constructor) {
    return Object.assign(acc, constructor(value));
  }

  return acc;
}
