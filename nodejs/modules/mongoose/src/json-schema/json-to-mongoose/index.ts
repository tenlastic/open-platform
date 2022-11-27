import * as mongoose from 'mongoose';

const schemaParamsToMongoose = {
  default: (value: string) => ({ default: value }),
  enum: (value: any[]) => ({ enum: value }),
  maxLength: (value: number) => ({ maxlength: value }),
  maximum: (value: number) => ({ max: value }),
  minLength: (value: number) => ({ minlength: value }),
  minimum: (value: number) => ({ min: value }),
  pattern: (value: string) => ({ match: RegExp(value) }),
  type: (value: string) => ({ type: typeToMongoose[value] }),
};

const typeToMongoose = {
  boolean: Boolean,
  date: Date,
  number: Number,
  objectId: mongoose.Types.ObjectId,
  string: String,
};

export function jsonToMongoose(jsonSchema: any) {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
  }

  const typeIsDate = jsonSchema.format === 'date-time' && jsonSchema.type === 'string';
  const typeIsDefined = 'type' in jsonSchema;
  const typeIsObjectId = jsonSchema.pattern === '^[0-9A-Fa-f]{24}$' && jsonSchema.type === 'string';

  if (typeIsDate) {
    return Date;
  } else if (typeIsObjectId) {
    return mongoose.Schema.Types.ObjectId;
  } else if (jsonSchema.type in typeToMongoose) {
    return Object.entries(jsonSchema).reduce(toMongooseParams, {});
  } else if (jsonSchema.type === 'object') {
    return getObjectType(jsonSchema);
  } else if (jsonSchema.type === 'array') {
    return getArrayType(jsonSchema);
  } else if (!typeIsDefined) {
    return mongoose.Schema.Types.Mixed;
  }

  throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
}

function getArrayType(jsonSchema: any) {
  if (jsonSchema.items && Object.keys(jsonSchema.items).length > 0) {
    return [jsonToMongoose(jsonSchema.items)];
  }

  return [mongoose.Schema.Types.Mixed];
}

function getObjectType(jsonSchema: any) {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return mongoose.Schema.Types.Mixed;
  }

  const converted = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = jsonToMongoose(value);
    return previousValue;
  }, {});

  if (jsonSchema.required) {
    return Object.entries(converted).reduce((previousValue, [key, value]) => {
      previousValue[key] = subSchemaType(jsonSchema, value, key);
      return previousValue;
    }, {});
  }

  return converted;
}

function subSchemaType(parentSchema: any, subschema: any, key: any) {
  if (0 <= parentSchema.required.indexOf(key)) {
    if (subschema.constructor !== Object) {
      return { required: true, type: subschema };
    }

    if (subschema.hasOwnProperty('type')) {
      return Object.assign(subschema, { required: true });
    }
  }

  return subschema;
}

function toMongooseParams(acc: any, [key, value]) {
  const constructor = schemaParamsToMongoose[key];

  if (constructor) {
    return Object.assign(acc, constructor(value));
  }

  return acc;
}
