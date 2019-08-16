import * as mongoose from 'mongoose';

const schemaParamsToMongoose = {
  type: (value: string) => ({ type: typeToMongoose[value] }),
  default: (value: string) => ({ default: value }),
  enum: (value: any[]) => ({ enum: value }),
  maximum: (value: number) => ({ max: value }),
  maxLength: (value: number) => ({ maxlength: value }),
  minimum: (value: number) => ({ min: value }),
  minLength: (value: number) => ({ minlength: value }),
  pattern: (value: string) => ({ match: RegExp(value) }),
};

const typeToMongoose = {
  boolean: Boolean,
  date: Date,
  number: Number,
  string: String,
};

export function toMongoose(jsonSchema: any) {
  if (jsonSchema.constructor !== Object) {
    throw new Error(`Unsupported JSON schema type: ${jsonSchema.type}.`);
  }

  let typeIsDate = jsonSchema.type === 'string' && jsonSchema.format === 'date-time';
  let typeIsDefined = 'type' in jsonSchema;

  if (typeIsDate) {
    return Date;
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
    return [toMongoose(jsonSchema.items)];
  }

  return [];
}

function getObjectType(jsonSchema: any) {
  if (!jsonSchema.properties || Object.keys(jsonSchema.properties).length === 0) {
    return mongoose.Schema.Types.Mixed;
  }

  const converted = Object.entries(jsonSchema.properties).reduce((previousValue, [key, value]) => {
    previousValue[key] = toMongoose(value);
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
      return { type: subschema, required: true };
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
