const schemaParamsToMongo = {
  type: (value: string) => ({ bsonType: typeToMongoose[value] }),
  default: (value: string) => ({ default: value }),
  enum: (value: any[]) => ({ enum: value }),
  maximum: (value: number) => ({ maximum: value }),
  maxLength: (value: number) => ({ maxlength: value }),
  minimum: (value: number) => ({ minimum: value }),
  minLength: (value: number) => ({ minlength: value }),
  pattern: (value: string) => ({ pattern: RegExp(value) }),
};

const typeToMongoose = {
  boolean: 'bool',
  number: 'double',
  string: 'string',
};

export function toMongo(jsonSchema: any) {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
  }

  let typeIsDate = jsonSchema.type === 'string' && jsonSchema.format === 'date-time';
  let typeIsDefined = 'type' in jsonSchema;

  if (typeIsDate) {
    return { bsonType: 'date' };
  } else if (jsonSchema.type in typeToMongoose) {
    return Object.entries(jsonSchema).reduce(toMongoParams, {});
  } else if (jsonSchema.type === 'object') {
    return getObjectType(jsonSchema);
  } else if (jsonSchema.type === 'array') {
    return getArrayType(jsonSchema);
  } else if (!typeIsDefined) {
    return { bsonType: 'object' };
  }

  throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
}

function getArrayType(jsonSchema: any) {
  if (jsonSchema.items && Object.keys(jsonSchema.items).length > 0) {
    return { bsonType: 'array', items: toMongo(jsonSchema.items) };
  }

  return { bsonType: 'array', items: { bsonType: 'object' } };
}

function getObjectType(jsonSchema: any) {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return { bsonType: 'object' };
  }

  const properties = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = toMongo(value);
    return previousValue;
  }, {});

  const converted: any = { bsonType: 'object', properties };

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
